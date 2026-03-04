const fs = require('fs');
const path = require('path');

const hooksDir = path.join(__dirname, 'hooks');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const original = content;
            // Replace staleTime: <anything> with staleTime: 0
            content = content.replace(/staleTime:\s*[^,\n]+[,]?/g, 'staleTime: 0,');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated staleTime in ${fullPath}`);
            }
        }
    }
}

if (fs.existsSync(hooksDir)) {
    processDir(hooksDir);
}

// Also let's ensure we are not caching API responses.
const apiDir = path.join(__dirname, 'app', 'api');
function fixApiDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixApiDir(fullPath);
        } else if (file === 'route.js' || file === 'route.ts') {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Check if it's already using force-dynamic
            if (!content.includes("export const dynamic") && (content.includes('export async function GET') || content.includes('export function GET'))) {
                content = "export const dynamic = 'force-dynamic';\n" + content;
                fs.writeFileSync(fullPath, content);
                console.log(`Added force-dynamic to ${fullPath}`);
            }
        }
    }
}

if (fs.existsSync(apiDir)) {
    fixApiDir(apiDir);
}
