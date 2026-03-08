import { Injectable, Logger } from '@nestjs/common';
import { CustomerLayout } from '@ecommerce/schema';
import { mergeLayouts } from './merger.utils';
import { FashionTemplate, HomeAppliancesTemplate, MomAndBabyTemplate, ReadyToEatTemplate } from '@ecommerce/master-templates';

// For Layer 1 Caching, we would typically use 'cache-manager' or 'lru-cache'
// Below is a simplified in-memory map representing our 50MB L1 Cache for hot shops.
const l1Cache = new Map<string, { layout: CustomerLayout, timestamp: number }>();

@Injectable()
export class LayoutService {
    private readonly logger = new Logger(LayoutService.name);

    // Simulated Database for currently active Delta Layouts (Tenant specifics)
    private tenantDB = new Map<string, CustomerLayout>(); // Just an in-memory mock

    /**
     * Syncs a Layout from the CLI into the Database.
     * Invalidates Cache.
     */
    async syncLayout(layout: CustomerLayout) {
        this.logger.log(`Syncing layout for shop: ${layout.shopId}`);

        // Save delta layout to DB
        this.tenantDB.set(layout.shopId, layout);

        // Invalidate L1 Cache
        l1Cache.delete(layout.shopId);

        // Feature 6: Snapshot Creation (Mocking)
        this.logger.log(`Created Snapshot Revision for rollback.`);

        // Future Feature: If using L2 Postgres Cache, we would pre-merge and save to Prisma.
    }

    /**
     * Retrieves and Merges the Layout for a Shop.
     * Uses L1 Cache -> L2 Cache -> MongoDB + Merge
     */
    async getCompiledLayout(shopId: string): Promise<CustomerLayout | null> {
        // 1. Check L1 Cache
        if (l1Cache.has(shopId)) {
            this.logger.debug(`[L1 CACHE HIT] Returned layout for ${shopId}`);
            return l1Cache.get(shopId)!.layout;
        }

        this.logger.debug(`[L1 CACHE MISS] Building layout for ${shopId}`);

        // 2. Fetch Tenant Data (Delta)
        const tenantDelta = this.tenantDB.get(shopId);
        if (!tenantDelta) {
            // If no tenant layout, maybe it doesn't exist.
            return null;
        }

        // 3. Fetch Master Template if baseLayoutId exists
        let masterTemplate: CustomerLayout | null = null;

        if (tenantDelta.baseLayoutId) {
            switch (tenantDelta.baseLayoutId) {
                case 'MASTER_FASHION': masterTemplate = FashionTemplate as CustomerLayout; break;
                case 'MASTER_HOME_APPLIANCES': masterTemplate = HomeAppliancesTemplate as CustomerLayout; break;
                case 'MASTER_MOM_AND_BABY': masterTemplate = MomAndBabyTemplate as CustomerLayout; break;
                case 'MASTER_READY_TO_EAT': masterTemplate = ReadyToEatTemplate as CustomerLayout; break;
            }
        }

        // 4. Merge Layouts
        let finalLayout = tenantDelta;
        if (masterTemplate) {
            finalLayout = mergeLayouts(masterTemplate, tenantDelta);
        }

        // 5. Save to L1 Cache
        l1Cache.set(shopId, { layout: finalLayout, timestamp: Date.now() });

        // 6. In a real system, we'd save to L2 Postgres Database 'MergedLayoutsCache' table here.

        return finalLayout;
    }
}
