import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const ATLAS_URI = "mongodb+srv://korewalordFeederdesu:CrMPli1GJ9tFZTl7@jsondb1.ddnq5v9.mongodb.net/ecommerce?appName=JSONdb1";

const GlobalLayoutSchema = new mongoose.Schema({
    shopId: { type: String, required: true, unique: true, index: true },
    publishedData: { type: mongoose.Schema.Types.Mixed, default: {} },
    draftData: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const PageLayoutSchema = new mongoose.Schema({
    shopId: { type: String, required: true },
    pageType: { type: String, required: true },
    slug: { type: String },
    publishedData: { type: mongoose.Schema.Types.Mixed, default: {} },
    draftData: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const GlobalLayout = mongoose.models.GlobalLayout || mongoose.model('GlobalLayout', GlobalLayoutSchema);
const PageLayout = mongoose.models.PageLayout || mongoose.model('PageLayout', PageLayoutSchema);

async function sync() {
    console.log('Connecting to Atlas with relaxed TLS...');
    await mongoose.connect(ATLAS_URI, { 
        serverSelectionTimeoutMS: 10000,
        tlsAllowInvalidCertificates: true
    });
    console.log('Connected to Atlas');

    const MASTER_ID = 'MASTER_STANDARD';

    const components = JSON.parse(fs.readFileSync('shop-components.json', 'utf8'));
    await GlobalLayout.updateOne({ shopId: MASTER_ID }, { $set: { publishedData: components, draftData: components } }, { upsert: true });
    console.log('Global synced');

    const pages = JSON.parse(fs.readFileSync('shop-pages.json', 'utf8'));
    for (const page of pages) {
        await PageLayout.updateOne(
            { shopId: MASTER_ID, pageType: page.pageType, slug: page.slug || null },
            { $set: { publishedData: page, draftData: page } },
            { upsert: true }
        );
        console.log(`Page ${page.pageType} synced`);
    }

    await mongoose.disconnect();
}

sync().catch(console.error);
