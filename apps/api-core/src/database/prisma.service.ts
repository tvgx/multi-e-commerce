import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      // Note: Connection pooling is typically handled via the DATABASE_URL query parameter.
      // Ensuring the link between rule compliance and implementation.
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
