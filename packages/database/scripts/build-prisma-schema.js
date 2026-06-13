/**
 * Prisma Schema Builder
 * =====================
 * Concatenates modular schema files into a single schema.prisma file
 * Run this before `prisma generate` or `prisma migrate`
 * 
 * Usage:
 *   node scripts/build-prisma-schema.js
 *   or via npm: npm run schema:build
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PRISMA_DIR = path.join(__dirname, '..', 'prisma');
const MODELS_DIR = path.join(PRISMA_DIR, 'models');
const SCHEMA_PATH = path.join(PRISMA_DIR, 'schema.prisma');
const SCHEMA_TEMPLATE_PATH = path.join(PRISMA_DIR, 'schema.template.prisma');

// Model files in order
const MODEL_FILES = [
  'auth.prisma',
  'shop.prisma',
  'product.prisma',
  'inventory.prisma',
  'order.prisma',
  'shipping.prisma',
  'payment.prisma',
  'wallet.prisma',
  'promotion.prisma',
  'content.prisma',
  'media.prisma',
  'interactions.prisma',
  'cart.prisma',
  'notifications.prisma',
  'analytics.prisma',
  'geo.prisma',
];

/**
 * Build the complete schema file
 */
function buildSchema() {
  console.log('🔨 Building Prisma schema...\n');

  try {
    // Read template
    let schemaContent = fs.readFileSync(SCHEMA_TEMPLATE_PATH, 'utf-8');

    // Read and append each model file
    for (const modelFile of MODEL_FILES) {
      const modelPath = path.join(MODELS_DIR, modelFile);
      
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Model file not found: ${modelPath}`);
      }

      const modelContent = fs.readFileSync(modelPath, 'utf-8');
      schemaContent += '\n' + modelContent;
      console.log(`✓ Included: ${modelFile}`);
    }

    // Write schema.prisma
    fs.writeFileSync(SCHEMA_PATH, schemaContent);
    console.log(`\n✅ Schema built successfully: ${SCHEMA_PATH}`);
    console.log(`📊 Total models: ${MODEL_FILES.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error building schema:', error.message);
    process.exit(1);
  }
}

/**
 * Watch mode - rebuild on file changes
 */
function watchMode() {
  const chokidar = require('chokidar');

  console.log('👀 Watching schema files for changes...\n');

  const watcher = chokidar.watch(MODELS_DIR, {
    persistent: true,
    ignored: /(^|[/\\])\.|node_modules/,
  });

  watcher.on('change', (filepath) => {
    console.log(`\n📝 File changed: ${path.basename(filepath)}`);
    buildSchema();
  });

  watcher.on('add', (filepath) => {
    console.log(`\n✨ File added: ${path.basename(filepath)}`);
    buildSchema();
  });

  return watcher;
}

// Main
if (require.main === module) {
  // Check for --watch flag
  const isWatchMode = process.argv.includes('--watch');

  buildSchema();

  if (isWatchMode) {
    try {
      watchMode();
    } catch (error) {
      console.log('(Watch mode requires chokidar: npm install --save-dev chokidar)');
    }
  }
}

module.exports = { buildSchema, watchMode };
