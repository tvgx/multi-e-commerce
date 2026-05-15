import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function runTest() {
  console.log('🚀 Starting Complete Shop Creation Flow Test...');

  const timestamp = Date.now();
  const shopName = `Vibe Fashion Test ${timestamp}`;
  const domain = `vibe-fashion-${timestamp}.localhost`;
  const ownerEmail = `test-owner-${timestamp}@example.com`;

  try {
    // 1. Create Owner & Shop
    console.log('Step 1: Creating Owner & Shop...');
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        fullName: 'Fashion Test Owner',
        role: 'OWNER',
      }
    });

    const shop = await prisma.shop.create({
      data: {
        name: shopName,
        domain: domain,
        ownerId: owner.id,
        status: 'ACTIVE',
        templateType: 'fashion',
        onboardingStep: 1,
        onboardingStatus: { step1: 'COMPLETED' } as any,
      }
    });
    console.log(`✅ Shop Created: ${shop.id} (${domain})`);

    // 2. Initialize Navigation Menus
    console.log('Step 2: Initializing Navigation Menus...');
    await prisma.navigationMenu.createMany({
      data: [
        { 
          shopId: shop.id, 
          handle: 'main-menu', 
          title: 'Main Menu', 
          items: [
            { title: 'Home', url: '/' }, 
            { title: 'Catalog', url: '/catalog' }
          ] as any 
        },
        { 
          shopId: shop.id, 
          handle: 'footer-menu', 
          title: 'Footer Menu', 
          items: [
            { title: 'Search', url: '/search' }, 
            { title: 'About us', url: '/pages/about' }
          ] as any 
        }
      ]
    });

    // 3. Create 3 Categories (Collections)
    console.log('Step 3: Creating 3 Categories...');
    const categories = [
      { title: 'Summer Collection', slug: `summer-${timestamp}` },
      { title: 'Winter Collection', slug: `winter-${timestamp}` },
      { title: 'Accessories', slug: `accessories-${timestamp}` }
    ];
    
    const createdCollections = [];
    for (const cat of categories) {
      const col = await prisma.collection.create({
        data: {
          shopId: shop.id,
          title: cat.title,
          slug: cat.slug,
          isActive: true
        }
      });
      createdCollections.push(col);
    }
    console.log(`✅ Created ${createdCollections.length} Categories`);

    // 4. Create 12 Products
    console.log('Step 4: Creating 12 Products...');
    for (let i = 1; i <= 12; i++) {
      const catIndex = (i - 1) % 3;
      const col = createdCollections[catIndex];
      const productName = `Fashion Item ${i}`;
      const slug = `fashion-item-${i}-${timestamp}`;

      await prisma.product.create({
        data: {
          shopId: shop.id,
          name: productName,
          slug: slug,
          status: 'PUBLISHED',
          variants: {
            create: {
              sku: `SKU-FASH-${i}-${timestamp}`,
              price: 100000 + (i * 50000),
              isMaster: true,
            }
          },
          collections: {
            create: {
              collectionId: col.id
            }
          }
        }
      });
    }
    console.log('✅ Created 12 Products');

    // 5. Update Onboarding Progress
    console.log('Step 5: Updating Onboarding Progress...');
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        onboardingStep: 5,
        onboardingStatus: {
          step1: 'COMPLETED',
          step2: 'COMPLETED',
          step3: 'COMPLETED',
          step4: 'COMPLETED',
          step5: 'COMPLETED'
        } as any
      }
    });

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY! 🎉');
    console.log(`Shop ID: ${shop.id}`);
    console.log(`Domain: ${domain}`);
    console.log(`Owner: ${ownerEmail}`);
    console.log('\nNext steps (TODO):');
    console.log('- Setup Payment Methods');
    console.log('- Verify in Storefront: http://localhost:3002');

  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
