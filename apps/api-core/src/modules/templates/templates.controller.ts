import { Controller, Get, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @UseGuards(BetterAuthGuard)
  async getTemplates() {
    return this.templatesService.getMasterTemplates();
  }
}
