import { Controller, Get, Inject } from '@nestjs/common';
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
}
