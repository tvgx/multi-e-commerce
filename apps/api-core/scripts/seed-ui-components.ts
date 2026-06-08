import mongoose from 'mongoose';
import { UIComponentCatalogSchema } from '@ecommerce/database';
import { schemaRegistry } from '@ecommerce/ui-registry/src/registry';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../packages/database/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/multi-ecommerce?authSource=admin';

async function seed() {
    console.log('Connecting to MongoDB...', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    
    const UIComponentCatalog = mongoose.models.UIComponentCatalog || mongoose.model('UIComponentCatalog', UIComponentCatalogSchema);

    console.log('Clearing existing UI components...');
    await UIComponentCatalog.deleteMany({});

    console.log(`Found ${Object.keys(schemaRegistry).length} schemas. Seeding...`);
    
    for (const [key, schema] of Object.entries(schemaRegistry)) {
        const schemaName = schema.name || schema.title;
        if (!schema || !schemaName) {
            console.log(`Skipping invalid schema: ${key}`);
            continue;
        }

        const type = schema.category === 'Atomic Blocks' || schema.type === 'block' ? 'block' : 'section';

        await UIComponentCatalog.create({
            componentId: key,
            name: schemaName,
            category: schema.category || 'Uncategorized',
            type: type,
            settings: schema.settings || [],
            allowedBlocks: schema.allowedBlocks || []
        });
        console.log(`Seeded: ${key} (${schemaName})`);
    }

    console.log('Seeding completed successfully!');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
