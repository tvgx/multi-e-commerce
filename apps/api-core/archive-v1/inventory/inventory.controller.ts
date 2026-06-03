import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateStockLocationDto,
  UpdateStockLocationDto,
  AdjustStockItemDto,
} from './dto/inventory-zod.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';

@Controller('stock-locations')
@UseGuards(BetterAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async createStockLocation(
    @CurrentUser() user: any,
    @Body() dto: CreateStockLocationDto,
  ) {
    return this.inventoryService.createStockLocation(user.id, dto);
  }

  @Get()
  async getAllStockLocations(@Query('shopId') shopId?: string) {
    return this.inventoryService.getAllStockLocations(shopId);
  }

  @Get(':id')
  async getStockLocationDetail(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.inventoryService.getStockLocationDetail(user.id, id);
  }

  @Put(':id')
  async updateStockLocation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateStockLocationDto,
  ) {
    return this.inventoryService.updateStockLocation(user.id, id, dto);
  }

  @Delete(':id')
  async deleteStockLocation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.inventoryService.deleteStockLocation(user.id, id);
  }

  @Post(':locationId/items')
  async adjustStockItem(
    @CurrentUser() user: any,
    @Param('locationId') locationId: string,
    @Body() dto: AdjustStockItemDto,
  ) {
    return this.inventoryService.adjustStockItem(user.id, locationId, dto);
  }

  @Get(':locationId/items')
  async getStockItemsByLocation(
    @CurrentUser() user: any,
    @Param('locationId') locationId: string,
  ) {
    return this.inventoryService.getStockItemsByLocation(user.id, locationId);
  }
}
