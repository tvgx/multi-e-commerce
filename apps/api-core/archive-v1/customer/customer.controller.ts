import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  SubscribeDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerProfileUpdateDto,
  GetCustomersQueryDto,
} from './dto/customer.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('subscribe')
  async subscribe(@Body() dto: SubscribeDto): Promise<BaseResponseDto<any>> {
    return this.customerService.subscribe(dto);
  }

  // ==========================================
  // SHOP OWNER CRUD ENDPOINTS
  // ==========================================

  @Get()
  @UseGuards(BetterAuthGuard)
  async getCustomers(
    @CurrentUser() user: any,
    @Query() query: GetCustomersQueryDto,
    @Req() req: any,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'owner') {
      throw new ForbiddenException('Only owners can access this resource');
    }
    return this.customerService.getCustomers(user.id, query);
  }

  @Get(':id')
  @UseGuards(BetterAuthGuard)
  async getCustomerDetail(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('shopId') shopId: string,
    @Req() req: any,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'owner') {
      throw new ForbiddenException('Only owners can access this resource');
    }
    return this.customerService.getCustomerDetail(user.id, shopId, id);
  }

  @Post()
  @UseGuards(BetterAuthGuard)
  async createCustomer(
    @CurrentUser() user: any,
    @Body() dto: CreateCustomerDto,
    @Req() req: any,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'owner') {
      throw new ForbiddenException('Only owners can access this resource');
    }
    return this.customerService.createCustomer(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(BetterAuthGuard)
  async updateCustomer(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req: any,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'owner') {
      throw new ForbiddenException('Only owners can access this resource');
    }
    return this.customerService.updateCustomer(user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(BetterAuthGuard)
  async deleteCustomer(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('shopId') shopId: string,
    @Req() req: any,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'owner') {
      throw new ForbiddenException('Only owners can access this resource');
    }
    return this.customerService.deleteCustomer(user.id, shopId, id);
  }

  // ==========================================
  // STOREFRONT CUSTOMER PERSONAL ENDPOINTS
  // ==========================================

  @Get('profile/me')
  @UseGuards(BetterAuthGuard)
  async getCustomerProfile(
    @CurrentUser() customer: any,
    @Req() req: any,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'customer') {
      throw new ForbiddenException(
        'Only storefront customers can access this resource',
      );
    }
    return this.customerService.getCustomerProfile(
      customer.id,
      customer.shopId,
    );
  }

  @Patch('profile/me')
  @UseGuards(BetterAuthGuard)
  async updateCustomerProfile(
    @CurrentUser() customer: any,
    @Body() dto: CustomerProfileUpdateDto,
    @Req() req: any,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'customer') {
      throw new ForbiddenException(
        'Only storefront customers can access this resource',
      );
    }
    return this.customerService.updateCustomerProfile(
      customer.id,
      customer.shopId,
      dto,
    );
  }

  @Get('profile/orders')
  @UseGuards(BetterAuthGuard)
  async getCustomerOrders(
    @CurrentUser() customer: any,
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'customer') {
      throw new ForbiddenException(
        'Only storefront customers can access this resource',
      );
    }
    const parsedLimit = limit ? Number(limit) : 10;
    const parsedOffset = offset ? Number(offset) : 0;
    return this.customerService.getCustomerOrders(
      customer.id,
      customer.shopId,
      parsedLimit,
      parsedOffset,
    );
  }

  @Get('profile/orders/:orderId')
  @UseGuards(BetterAuthGuard)
  async getCustomerOrderDetail(
    @CurrentUser() customer: any,
    @Param('orderId') orderId: string,
    @Req() req: any,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'customer') {
      throw new ForbiddenException(
        'Only storefront customers can access this resource',
      );
    }
    return this.customerService.getCustomerOrderDetail(
      customer.id,
      customer.shopId,
      orderId,
    );
  }
}

