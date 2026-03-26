import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  shopId: string;
}

@Injectable()
export class TenantService {
  private static readonly als = new AsyncLocalStorage<TenantContext>();

  run(context: TenantContext, callback: () => void) {
    return TenantService.als.run(context, callback);
  }

  getTenantId(): string | undefined {
    return TenantService.als.getStore()?.shopId;
  }
}
