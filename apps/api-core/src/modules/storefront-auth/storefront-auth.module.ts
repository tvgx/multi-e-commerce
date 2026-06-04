import { Module } from '@nestjs/common';
import { StorefrontAuthService } from './storefront-auth.service';
import { StorefrontAuthController } from './storefront-auth.controller';
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, EmailModule],
  providers: [StorefrontAuthService],
  controllers: [StorefrontAuthController],
  exports: [StorefrontAuthService],
})
export class StorefrontAuthModule {}
