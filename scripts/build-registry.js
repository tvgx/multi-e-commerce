const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../packages/ui-registry/src/components');
const registryFile = path.resolve(__dirname, '../packages/ui-registry/src/registry.ts');

function walk(dir, baseDir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === 'ui') return; // skip shadcn base ui elements for the visual builder registry
        let filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(filePath, baseDir));
        } else if (filePath.endsWith('.tsx') && !filePath.endsWith('index.tsx')) { 
            // convert backslashes to forward slashes
            const relPath = path.relative(baseDir, filePath).replace(/\\/g, '/').replace('.tsx', '');
            
            // get component name from file name (assume PascalCase if it's a section, or kebab-case to PascalCase)
            let baseName = path.basename(filePath, '.tsx');
            let compName = baseName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            compName = compName.charAt(0).toUpperCase() + compName.slice(1);
            
            results.push({ compName, relPath });
        }
    });
    return results;
}

const components = walk(targetDir, targetDir);
// remove duplicates by compName
const uniqueMap = {};
components.forEach(c => {
    // prefer 'sections' or 'products' over root if duplicated
    if (!uniqueMap[c.compName] || c.relPath.includes('sections/')) {
        uniqueMap[c.compName] = c;
    }
});

let imports = '';
let properties = [];
let exportsStr = '';

Object.values(uniqueMap).forEach(c => {
    imports += `import { ${c.compName} } from './components/${c.relPath}';\n`;
    properties.push(`  ${c.compName}`);
    exportsStr += `export * from './components/${c.relPath}';\n`;
});

const fileContent = `
${imports}

export const registry: Record<string, any> = {
${properties.join(',\n')}
};

${exportsStr}
`;

fs.writeFileSync(registryFile, fileContent, 'utf8');
console.log('Registry built with ' + Object.keys(uniqueMap).length + ' components.');
