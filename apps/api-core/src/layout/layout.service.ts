import { Injectable, Logger } from '@nestjs/common';
import { CustomerLayout } from '@ecommerce/schema';
import { mergeLayouts } from './merger.utils';
import { MinioService } from '../storage/minio.service';
import {
    FashionTemplate,
    HomeAppliancesTemplate,
    MomAndBabyTemplate,
    ReadyToEatTemplate,
} from '@ecommerce/master-templates';

/**
 * L1 In-memory Cache — keeps the top ~5 000 hot shops in RAM.
 * LRU-style: we cap at MAX_L1_ENTRIES and evict the oldest on overflow.
 * At ~2KB average per entry, 5 000 entries ≈ 10MB RAM maximum.
 */
const MAX_L1_ENTRIES = 5_000;
const L1_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
    layout: CustomerLayout;
    timestamp: number;
}

const l1Cache = new Map<string, CacheEntry>();

function l1Set(shopId: string, layout: CustomerLayout) {
    // Evict oldest entry when cache is full
    if (l1Cache.size >= MAX_L1_ENTRIES) {
        const firstKey = l1Cache.keys().next().value;
        if (firstKey) l1Cache.delete(firstKey);
    }
    l1Cache.set(shopId, { layout, timestamp: Date.now() });
}

function l1Get(shopId: string): CustomerLayout | null {
    const entry = l1Cache.get(shopId);
    if (!entry) return null;
    // TTL check
    if (Date.now() - entry.timestamp > L1_TTL_MS) {
        l1Cache.delete(shopId);
        return null;
    }
    return entry.layout;
}

// ─────────────────────────────────────────

@Injectable()
export class LayoutService {
    private readonly logger = new Logger(LayoutService.name);

    constructor(private readonly minioService: MinioService) { }

    /**
     * Syncs a new/updated Layout from the CLI → MinIO → invalidate L1 cache.
     * Then triggers Next.js ISR cache invalidation via revalidateTag.
     */
    async syncLayout(layout: CustomerLayout) {
        if (!layout.shopId) throw new Error('layout.shopId is required');
        this.logger.log(`[LayoutService] Syncing layout for shop: ${layout.shopId}`);

        // 1. Persist to MinIO (durable, survives restarts)
        await this.minioService.saveLayout(layout.shopId, layout);

        // 2. Invalidate L1 cache so next request rebuilds from MinIO
        l1Cache.delete(layout.shopId);

        // 3. Trigger Next.js ISR revalidation (on-demand cache purge)
        //    Next.js exposes POST /api/revalidate?tag=layout-{shopId} via route handler
        await this.triggerNextRevalidate(`layout-${layout.shopId}`);

        this.logger.log(`[LayoutService] Layout synced and caches invalidated for ${layout.shopId}`);
    }

    /**
     * Returns the fully merged (Master Template + Tenant Delta) layout for a shop.
     * Cache hierarchy: L1 in-memory → MinIO (+ merge) → null (not found)
     */
    async getCompiledLayout(shopId: string): Promise<CustomerLayout | null> {
        // ── Step 1: L1 cache check ──
        const cached = l1Get(shopId);
        if (cached) {
            this.logger.debug(`[L1 HIT] ${shopId}`);
            return cached;
        }

        this.logger.debug(`[L1 MISS] Building layout for ${shopId}`);

        // ── Step 2: Load tenant delta from MinIO ──
        const tenantDelta = await this.minioService.getLayout<CustomerLayout>(shopId);
        if (!tenantDelta) {
            this.logger.warn(`[LayoutService] No layout found in MinIO for shopId=${shopId}`);
            return null;
        }

        // ── Step 3: Resolve Master Template ──
        let masterTemplate: CustomerLayout | null = null;
        if (tenantDelta.baseLayoutId) {
            switch (tenantDelta.baseLayoutId) {
                case 'MASTER_FASHION':
                    masterTemplate = FashionTemplate as CustomerLayout;
                    break;
                case 'MASTER_HOME_APPLIANCES':
                    masterTemplate = HomeAppliancesTemplate as CustomerLayout;
                    break;
                case 'MASTER_MOM_AND_BABY':
                    masterTemplate = MomAndBabyTemplate as CustomerLayout;
                    break;
                case 'MASTER_READY_TO_EAT':
                    masterTemplate = ReadyToEatTemplate as CustomerLayout;
                    break;
            }
        }

        // ── Step 4: Merge Master + Tenant ──
        const finalLayout = masterTemplate
            ? mergeLayouts(masterTemplate, tenantDelta)
            : tenantDelta;

        // ── Step 5: Store in L1 cache ──
        l1Set(shopId, finalLayout);

        return finalLayout;
    }

    // ─────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────

    /**
     * Calls the Next.js revalidate API route to purge the ISR cache for a given tag.
     * The storefront must expose: POST /api/revalidate?tag=<tag>&secret=<REVALIDATE_SECRET>
     */
    private async triggerNextRevalidate(tag: string): Promise<void> {
        const nextUrl = process.env.STOREFRONT_URL ?? 'http://localhost:3000';
        const secret = process.env.REVALIDATE_SECRET ?? 'dev_secret';

        try {
            const res = await fetch(
                `${nextUrl}/api/revalidate?tag=${encodeURIComponent(tag)}&secret=${secret}`,
                { method: 'POST' },
            );
            if (!res.ok) {
                this.logger.warn(`[LayoutService] Revalidate returned ${res.status} for tag=${tag}`);
            } else {
                this.logger.debug(`[LayoutService] Revalidated Next.js cache tag: ${tag}`);
            }
        } catch (err) {
            // Non-fatal — ISR TTL will eventually expire
            this.logger.warn(`[LayoutService] Could not reach Next.js for revalidation: ${err}`);
        }
    }
}
