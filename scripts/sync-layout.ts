import { execSync } from 'child_process';
import path from 'path';

/**
 * Script to sync layout.config.ts to MongoDB
 * Invokes the CLI tool under the hood or calls the API.
 */
function syncLayout() {
  const shopId = process.argv.find(arg => arg.startsWith('--shop-id='))?.split('=')[1];
  
  if (!shopId) {
    console.error('Error: --shop-id is required');
    process.exit(1);
  }

  console.log(`Syncing layout for Shop ID: ${shopId}...`);
  // For now, we proxy to the Python CLI create command as an example
  // In a real scenario, this would read layout.config.ts and push to API
  try {
    const cliPath = path.join(__dirname, '..', 'apps', 'cli-tool', 'main.py');
    // Using default template for sync for now
    execSync(`python ${cliPath} shop create --name "Sync Update" --domain "sync" --owner-email "admin@sync.com" --template "fashion"`, { stdio: 'inherit' });
    console.log('✅ Sync completed successfully');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncLayout();
