import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface AuthContext {
  userId: string | null;
  authType: string;
  /** Tenants (shopIds) the user owns, if api-core returned them. */
  tenantIds?: string[];
}

/**
 * Authenticates a chat request by DELEGATING to api-core's better-auth session
 * check, rather than pulling better-auth + Prisma into this service. The
 * incoming cookies/headers are forwarded to `${API_CORE_URL}/auth/verify-session`;
 * a 2xx means the session is valid. This is the "run on shared auth" path.
 *
 * For local dev / evaluation set `DESIGN_AGENT_AUTH_DISABLED=true` to bypass.
 *
 * Tenant ownership: if api-core returns the user's shopIds we enforce that the
 * requested `tenant_id` is one of them; data-layer scoping in the tool executor
 * is the second line of defense regardless.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly logger = new Logger(SessionAuthGuard.name);

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    if (this.config.get<string>('DESIGN_AGENT_AUTH_DISABLED') === 'true') {
      (req as Request & { authContext: AuthContext }).authContext = {
        userId: 'dev',
        authType: 'owner',
      };
      return true;
    }

    const apiCoreUrl =
      this.config.get<string>('API_CORE_URL') ?? 'http://localhost:3000';

    let res: Response;
    try {
      res = await fetch(`${apiCoreUrl}/auth/verify-session`, {
        method: 'GET',
        headers: {
          cookie: req.headers.cookie ?? '',
          authorization: req.headers.authorization ?? '',
          'x-auth-type': (req.headers['x-auth-type'] as string) ?? 'owner',
        },
      });
    } catch (err) {
      this.logger.error(
        `auth delegation to api-core failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw new UnauthorizedException('Auth service unavailable.');
    }

    if (!res.ok) {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    const auth = await this.parseAuth(res);
    (req as Request & { authContext: AuthContext }).authContext = auth;

    const tenantId = (req.body as { tenant_id?: string } | undefined)?.tenant_id;
    if (
      tenantId &&
      auth.tenantIds &&
      auth.tenantIds.length > 0 &&
      !auth.tenantIds.includes(tenantId)
    ) {
      throw new ForbiddenException(
        `You do not have access to tenant "${tenantId}".`,
      );
    }

    return true;
  }

  private async parseAuth(res: Response): Promise<AuthContext> {
    try {
      const body = (await res.json()) as Record<string, unknown>;
      const data = (body.data ?? body) as Record<string, unknown>;
      const user = (data.user ?? data) as Record<string, unknown>;
      const tenantIds =
        (data.shopIds as string[] | undefined) ??
        (user.shopIds as string[] | undefined);
      return {
        userId: (user.id as string) ?? null,
        authType: (data.authType as string) ?? 'owner',
        tenantIds,
      };
    } catch {
      return { userId: null, authType: 'owner' };
    }
  }
}
