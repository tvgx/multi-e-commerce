import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// B. Sharded Data Storage - MongoDB
// ==========================================

// 1. GlobalTemplates
export interface IGlobalTemplate extends Document {
    category_code: string;
    base_layout: any[]; // JSON array of layout components
    version: number;
}

const GlobalTemplateSchema: Schema = new Schema({
    category_code: { type: String, required: true, unique: true, index: true }, // Shard Key
    base_layout: { type: Schema.Types.Mixed, required: true },
    version: { type: Number, default: 1 }
}, { timestamps: true });

// 2. ShopLayouts
export interface IShopLayout extends Document {
    shop_id: string;
    custom_styles: Record<string, any>;
    is_using_default: boolean;
    overrides: any[];
}

const ShopLayoutSchema: Schema = new Schema({
    shop_id: { type: String, required: true, unique: true, index: true }, // Shard Key
    custom_styles: { type: Schema.Types.Mixed, default: {} },
    is_using_default: { type: Boolean, default: true },
    overrides: { type: Schema.Types.Mixed, default: [] }
}, { timestamps: true });

// 3. Products
export interface IProduct extends Document {
    id: string; // Smart-ID: 'CLO-P1'
    shop_id: string;
    name: string;
    attributes: Record<string, any>;
}

const ProductSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    shop_id: { type: String, required: true, index: true }, // Shard Key
    name: { type: String, required: true },
    attributes: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const GlobalTemplate = mongoose.model<IGlobalTemplate>('GlobalTemplate', GlobalTemplateSchema);
export const ShopLayout = mongoose.model<IShopLayout>('ShopLayout', ShopLayoutSchema);
export const Product = mongoose.model<IProduct>('Product', ProductSchema);
