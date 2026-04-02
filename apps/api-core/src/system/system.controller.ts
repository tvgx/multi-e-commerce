import { Controller, Get, Post, Body } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('api/system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  getHealth() {
    return this.systemService.getSystemHealth();
  }

  @Post('validate-json')
  validateJson(@Body('jsonConfig') jsonConfig: string) {
    return this.systemService.validateJsonSetup(jsonConfig);
  }

  @Post('mass-sync')
  massSync(
    @Body('targetAttr') targetAttr: string,
    @Body('newValue') newValue: any,
  ) {
    return this.systemService.massSyncFeature(targetAttr, newValue);
  }
}
