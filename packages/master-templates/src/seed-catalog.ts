import mongoose from 'mongoose';
import { MasterTemplateCatalog } from '@ecommerce/database';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from the root or database package if needed
dotenv.config({ path: resolve(__dirname, '../../../packages/database/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

const TEMPLATES = [
  {
    templateKey: 'MASTER_HOME_APPLIANCES',
    templateType: 'technical',
    industry: 'electronics',
    displayName: 'Điện tử',
    description: 'Tối ưu hiển thị đồ công nghệ.',
    icon: '💻',
    isCustom: false,
  },
  {
    templateKey: 'MASTER_MOM_AND_BABY',
    templateType: 'standard',
    industry: 'mom_baby',
    displayName: 'Mẹ và Bé',
    description: 'Màu sắc tươi sáng, an toàn.',
    icon: '👶',
    isCustom: false,
  },
  {
    templateKey: 'MASTER_SPORTS',
    templateType: 'visual',
    industry: 'sports',
    displayName: 'Thể thao',
    description: 'Thiết kế năng động, mạnh mẽ.',
    icon: '🏅',
    isCustom: false,
  },
  {
    templateKey: 'MASTER_PACKAGED_FOOD',
    templateType: 'standard',
    industry: 'food',
    displayName: 'Đồ ăn đóng gói',
    description: 'Hiển thị thực phẩm, siêu thị.',
    icon: '🍪',
    isCustom: false,
  },
  {
    templateKey: 'CUSTOM_DESIGN',
    templateType: 'standard',
    industry: 'custom',
    displayName: 'Tự thiết kế',
    description: 'Tự do trải nghiệm kéo thả layout.',
    icon: '🎨',
    isCustom: true,
  },
];

async function seed() {
  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);

    console.log('Clearing existing catalog...');
    await MasterTemplateCatalog.deleteMany({});

    console.log('Inserting master templates...');
    await MasterTemplateCatalog.insertMany(TEMPLATES);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding catalog:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
