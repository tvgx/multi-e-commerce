import { Controller, Get, Inject, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    @Inject(AppService)
    private readonly appService: AppService,
  ) {
    this.getHello = this.getHello.bind(this);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('favicon.ico')
  @HttpCode(204)
  getFavicon() {
    return;
  }
}
