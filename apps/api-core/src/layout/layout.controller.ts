import { Controller, Post, Body, Get, Param, UsePipes, BadRequestException } from '@nestjs/common';
import { LayoutService } from './layout.service';
import { CustomerLayout, CustomerLayoutSchema } from '@ecommerce/schema';

// NestJS Custom Zod Pipe for Strict Validation
import { PipeTransform, ArgumentMetadata } from '@nestjs/common';

export class ZodValidationPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        try {
            return CustomerLayoutSchema.parse(value);
        } catch (error) {
            throw new BadRequestException('Validation failed');
        }
    }
}

@Controller('api/layouts')
export class LayoutController {
    constructor(private readonly layoutService: LayoutService) { }

    @Post('sync')
    @UsePipes(new ZodValidationPipe())
    async syncLayout(@Body() layoutPayload: CustomerLayout) {
        // 1. Auth Guard normally checks if user is allowed to sync this shop

        // 2. Pass to service
        await this.layoutService.syncLayout(layoutPayload);

        return {
            success: true,
            message: `Layout synced successfully for shop ${layoutPayload.shopId}`
        };
    }

    @Get(':shopId')
    async getLayout(@Param('shopId') shopId: string) {
        const layout = await this.layoutService.getCompiledLayout(shopId);

        if (!layout) {
            // Return 404 or empty template if not found
            return {
                success: false,
                message: 'Layout not found for this shop.'
            };
        }

        return {
            success: true,
            data: layout
        };
    }
}
