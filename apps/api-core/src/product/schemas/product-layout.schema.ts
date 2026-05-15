import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = ProductLayout & Document;

@Schema({ timestamps: true, collection: 'product_layouts' })
export class ProductLayout {
  @Prop({ type: String, required: true, index: true })
  productId: string; // Khớp với id bên bảng Product của PostgreSQL

  @Prop({ type: String, required: true, index: true })
  shopId: string; // Khớp với id bên bảng Shop của PostgreSQL

  // HTML Content / Rich Text Editor Content
  @Prop({ type: String, default: '' })
  descriptionHtml: string;

  // Gallery hình ảnh
  @Prop({ type: [String], default: [] })
  imageUrls: string[];

  @Prop({ type: [String], default: [] })
  videoUrls: string[];

  // Biến thể linh hoạt (Flexible Attributes)
  // vd: { "Color": "Red", "Size": "XL", "Material": "Cotton" }
  @Prop({ type: Object, default: {} })
  attributes: Record<string, any>;

  @Prop({ type: Array, default: [] })
  variantsData: Array<{
    sku: string;
    attributes: Record<string, any>;
    image: string;
  }>;

  // Custom SEO Tags cho riêng sản phẩm
  @Prop({
    type: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: [String], default: [] },
    },
    default: {},
  })
  seoData: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };

  // Cấu trúc JSON Layout đặc biệt dành cho landing page giới thiệu sản phẩm (Zero-File)
  @Prop({ type: Object, default: null })
  customLandingPageLayout: Record<string, any> | null;
}

export const ProductLayoutSchema = SchemaFactory.createForClass(ProductLayout);
