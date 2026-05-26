import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('api/system')
export class SystemController {
  constructor(
    @Inject(SystemService)
    private readonly systemService: SystemService,
  ) {
    this.getHealth = this.getHealth.bind(this);
    this.validateJson = this.validateJson.bind(this);
    this.massSync = this.massSync.bind(this);
  }

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
