import { execSync } from 'child_process';
import path from 'path';

/**
 * Script to generate Master Templates based on industry
 */
function generateMaster() {
  const industry = process.argv.find(arg => arg.startsWith('--industry='))?.split('=')[1];
  
  if (!industry) {
    console.error('Error: --industry is required');
    console.log('Available industries: fashion, home-appliances, mom-and-baby, ready-to-eat');
    process.exit(1);
  }

  console.log(`Generating Master Template for industry: ${industry}...`);
  try {
    const cliPath = path.join(__dirname, '..', 'apps', 'cli-tool', 'main.py');
    // Using default shop name for generation
    execSync(`python ${cliPath} shop create --name "Master Template ${industry}" --domain "master-${industry}" --owner-email "master@system.com" --template "${industry}"`, { stdio: 'inherit' });
    console.log(`✅ Master Template for ${industry} generated successfully`);
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

generateMaster();
