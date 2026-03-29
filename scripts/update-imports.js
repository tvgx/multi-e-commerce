const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('d:/Xuan/20252/DATN/ecommerce-platform/apps/storefront/src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk(targetDir);
let replacedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // Replace generic `@/components` with `@omni/ui-registry/components`
    content = content.replace(/@\/components\//g, '@omni/ui-registry/components/');
    
    // Also update any relative imports to generic ui components inside the old components directory
    // If we have "import { ... } from '../../components/X'" we should regex it but it's hard to catch all.
    // The codebase uses path aliases primarily `@/components/...`
    
    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        replacedCount++;
    }
});

console.log(`Updated imports in ${replacedCount} files in apps/storefront.`);
