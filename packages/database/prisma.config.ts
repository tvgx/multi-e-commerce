/**
 * Prisma Configuration Module
 * =============================
 * Centralized configuration for Prisma schema paths and database settings
 * 
 * Usage:
 *   const { getPrismaConfig } = require('./prisma.config');
 *   const config = getPrismaConfig();
 */
const path = require('path');

/**
 * Schema configuration interface
 * @typedef {Object} SchemaConfig
 * @property {string} schemaPath - Path to the main Prisma schema file
 * @property {string} modelsDir - Directory containing modular schema files
 * @property {string[]} modelFiles - All model file paths
 */

/**
 * Get Prisma configuration
 * @returns {Object} Prisma configuration object
 */
function getPrismaConfig() {
  const prismaDir = path.join(__dirname, 'prisma');
  const modelsDir = path.join(prismaDir, 'models');
  const schemaPath = path.join(prismaDir, 'schema.prisma');

  const modelFiles = [
    'auth.prisma',
    'shop.prisma',
    'product.prisma',
    'inventory.prisma',
    'order.prisma',
    'payment.prisma',
    'geography-tax.prisma',
    'promotion.prisma',
    'content.prisma',
  ].map((file) => path.join(modelsDir, file));

  return {
    schemaPath,
    modelsDir,
    modelFiles,
  };
}

/**
 * Get the main schema path for Prisma CLI
 * @returns {string} Path to the main schema.prisma file
 */
function getSchemaPath() {
  return getPrismaConfig().schemaPath;
}

/**
 * Get all model file paths
 * @returns {string[]} Array of paths to all model files
 */
function getModelFilePaths() {
  return getPrismaConfig().modelFiles;
}

/**
 * Verify that all schema files exist
 * @returns {boolean} true if all files exist, false otherwise
 */
function verifySchemaFiles() {
  try {
    const fs = require('fs');
    const config = getPrismaConfig();
    
    // Check main schema
    if (!fs.existsSync(config.schemaPath)) {
      console.error(`Main schema file not found: ${config.schemaPath}`);
      return false;
    }

    // Check all model files
    for (const modelFile of config.modelFiles) {
      if (!fs.existsSync(modelFile)) {
        console.error(`Model file not found: ${modelFile}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error verifying schema files:', error);
    return false;
  }
}

/**
 * Print configuration summary
 */
function printConfig() {
  const config = getPrismaConfig();
  console.log('📋 Prisma Configuration:');
  console.log(`   Schema:     ${config.schemaPath}`);
  console.log(`   Models Dir: ${config.modelsDir}`);
  console.log(`   Model Files:`);
  config.modelFiles.forEach((file) => {
    console.log(`      - ${path.basename(file)}`);
  });
}

// Export defaults
module.exports = {
  getPrismaConfig,
  getSchemaPath,
  getModelFilePaths,
  verifySchemaFiles,
  printConfig,
};
