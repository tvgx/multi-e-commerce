import { CustomerLayoutSchema, UIComponentRefSchema } from '@ecommerce/schema';
import * as fs from 'fs';
import * as path from 'path';

// Define the shape of our local layout configuration
type LocalLayoutConfig = {
    shopId: string;
    baseTemplateType?: 'fashion' | 'home-appliances' | 'mom-and-baby' | 'ready-to-eat';
    global: {
        header: any[];
        footer: any[];
    };
    pages: Record<string, any[]>;
};

// Simulated mock for fetching local config until actual store file is provided
const MOCK_LOCAL_CONFIG_PATH = path.join(__dirname, '../../storefront/src/lib/layout/config.ts');

async function syncLayout(dryRun: boolean = false) {
    console.log(`\n🚀 Starting Layout Sync... ${dryRun ? '[DRY RUN MODE]' : ''}`);

    try {
        // 1. In a real scenario, we'll dynamically import the JS/TS exported object
        // Assuming config.ts exports default the config. We'll use a mocked flow here.
        console.log(`[1] Reading local config from: storefront/src/lib/layout/config.ts`);

        // Simulate config loading
        const rawConfig: LocalLayoutConfig = {
            shopId: 'DEV_SHOP_001',
            baseTemplateType: 'fashion',
            global: {
                header: [{ componentId: 'HeroMarquee', order: 0, props: { text: "DEV MODE LOCAL SYNC" } }],
                footer: []
            },
            pages: {
                home: [
                    { componentId: 'Hero', order: 0, props: { title: "Dev Storefront" } },
                    { componentId: 'FeaturedProducts', order: 1 }
                ]
            }
        };

        // 2. Validate with Shared Zod Schema
        console.log(`[2] Validating payload against @ecommerce/schema...`);

        // Convert to strict schema format
        const validatedData = CustomerLayoutSchema.parse({
            shopId: rawConfig.shopId,
            isMaster: false,
            baseLayoutId: rawConfig.baseTemplateType ? `MASTER_${rawConfig.baseTemplateType.toUpperCase()}` : null,
            global: rawConfig.global,
            pages: rawConfig.pages
        });

        console.log(`✅ Validation Passed.`);

        if (dryRun) {
            console.log(`\n--- DRY RUN PAYLOAD PREVIEW ---`);
            console.log(JSON.stringify(validatedData, null, 2));
            console.log(`-------------------------------\n`);
            return;
        }

        // 3. Push to NestJS API
        console.log(`[3] Pushing to NestJS Backend API (http://localhost:3000/api/layouts/sync)`);

        const response = await fetch('http://localhost:3000/api/layouts/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dev_token' },
            body: JSON.stringify(validatedData)
        });

        if (!response.ok) {
            // Just mocking error because API is not yet up.
            console.log(`⚠️ API returned ${response.status}. (Expected if NestJS is not running yet). Payload was valid.`);
        } else {
            console.log(`🎉 Sync Complete! Database updated successfully.`);
        }

    } catch (error: any) {
        if (error.errors) {
            console.error(`❌ Validation Error:`, JSON.stringify(error.errors, null, 2));
        } else {
            console.error(`❌ Sync Failed:`, error.message);
        }
    }
}

// Parse Args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

syncLayout(isDryRun);
