import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// MongoDB Collections for E-commerce Platform
// ==========================================

// ------------------------------------------
// 1. ShopTemplates (UI-as-Code Configuration)
// ------------------------------------------
export interface IShopTemplate extends Document {
    shopId: string; // Foreign key linking to PostgreSQL Shop.id
    publishedData: Record<string, unknown>;
    draftData: Record<string, unknown>;
}

const ShopTemplateSchema: Schema = new Schema({
    shopId: { type: String, required: true, unique: true, index: true },
    publishedData: { type: Schema.Types.Mixed, default: {} },
    draftData: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });


// ------------------------------------------
// 2. Products (Universal / Tier Variation Pattern)
// ------------------------------------------
export interface IProduct extends Document {
    shopId: string; // Foreign key linking to PostgreSQL Shop.id
    name: string;
    description: string;
    images: string[];
    category: string;
    basePrice: {
        value: number;
        currency: string;
    };
    totalInventory: number;
    status: 'DRAFT' | 'ACTIVE';

    // General Attributes (e.g. Brand, Warranty)
    attributes: { name: string; value: string }[];

    // Tier Variations (e.g. Color, Capacity)
    tierVariations: {
        name: string;
        options: string[];
        images: string[]; // Mapping to options index
    }[];

    // Concrete Variants (SKU specific combinations)
    variants: {
        sku: string;
        tierIndex: number[];
        priceOverride: { value: number; currency: string } | null;
        stock: number;
        image: string | null;
    }[];
}

const ProductSchema: Schema = new Schema({
    shopId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    images: [{ type: String }],
    category: { type: String, default: 'Uncategorized' },
    basePrice: {
        value: { type: Number, required: true },
        currency: { type: String, default: 'USD' }
    },
    totalInventory: { type: Number, default: 0 },
    status: { type: String, enum: ['DRAFT', 'ACTIVE'], default: 'DRAFT' },

    attributes: [{
        name: { type: String, required: true },
        value: { type: String, required: true },
        _id: false
    }],

    tierVariations: [{
        name: { type: String, required: true },
        options: [{ type: String }],
        images: [{ type: String }],
        _id: false
    }],

    variants: [{
        sku: { type: String, required: true },
        tierIndex: [{ type: Number }],
        priceOverride: {
            value: { type: Number },
            currency: { type: String }
        },
        stock: { type: Number, default: 0 },
        image: { type: String },
        _id: false
    }]
}, { timestamps: true });

// Exports
export const ShopTemplate = mongoose.models.ShopTemplate || mongoose.model<IShopTemplate>('ShopTemplate', ShopTemplateSchema);
export const MongoProduct = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

