const fs = require('fs');
const path = './node_modules/kareem/index.js';
let content = fs.readFileSync(path, 'utf8');

const target = "Kareem.prototype.execPre = function(name, context, args, callback) {\n  if (arguments.length === 3) {\n    callback = args;\n    args = [];\n  }";

const replacement = target + "\n  if (typeof callback !== 'function') {\n    console.error('\\n\\n--- KAREEM CRASH DEBUG ---');\n    console.error('execPre called without callback for hook:', name);\n    console.error(new Error().stack);\n    console.error('--------------------------\\n\\n');\n    callback = function() {};\n  }";

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log('Successfully patched kareem/index.js');
} else {
  console.log('Could not find target string in kareem/index.js');
}
