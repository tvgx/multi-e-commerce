import { CanActivate, Injectable, ForbiddenException } from '@nestjs/common';

/**
 * Hard gate for the in-app test runner. This module can write source files and
 * spawn `jest` (arbitrary code execution), so it must never be reachable in
 * production. The module is also only registered in AppModule when not in
 * production — this guard is the second line of defense.
 */
@Injectable()
export class TestingGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Test runner is disabled in production');
    }
    return true;
  }
}
