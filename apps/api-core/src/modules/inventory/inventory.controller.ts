import { Controller, Get, Post, Param, Body, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { InventoryService, AdjustStockDto } from './inventory.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

@UseGuards(BetterAuthGuard, RolesGuard)
@RequireRoles('ADMIN', 'OWNER')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('variants/:id')
  getVariantStock(@Param('id') id: string) {
    return this.inventoryService.getVariantStock(id);
  }

  @Post('adjust')
  adjustStock(@Req() req: any, @Body() dto: AdjustStockDto) {
    const userId = req.user?.id;
    return this.inventoryService.adjustStock(dto, userId);
  }

  @Get('variants/:id/movements')
  getStockMovements(
    @Param('id') id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.inventoryService.getStockMovements(id, page || 1, limit || 20);
  }
}
