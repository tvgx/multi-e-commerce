import { Controller, Post, Body } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { SubscribeDto } from './dto/customer.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('subscribe')
  async subscribe(@Body() dto: SubscribeDto): Promise<BaseResponseDto<any>> {
    return this.customerService.subscribe(dto);
  }
}
