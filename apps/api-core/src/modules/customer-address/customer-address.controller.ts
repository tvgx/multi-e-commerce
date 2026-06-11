import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { CustomerAddressService } from './customer-address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/customer-address.dto';
import { StorefrontAuthGuard } from '../storefront-auth/guards/storefront-auth.guard';

@UseGuards(StorefrontAuthGuard)
@Controller('addresses')
export class CustomerAddressController {
  constructor(private readonly addressService: CustomerAddressService) {}

  private getCustomerId(req: any): string {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return customerId;
  }

  @Get()
  findAll(@Req() req: any) {
    return this.addressService.findAll(this.getCustomerId(req));
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.addressService.create(this.getCustomerId(req), dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressService.update(this.getCustomerId(req), id, dto);
  }

  @Post(':id/default')
  setDefault(@Req() req: any, @Param('id') id: string) {
    return this.addressService.setDefault(this.getCustomerId(req), id);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.addressService.remove(this.getCustomerId(req), id);
  }
}
