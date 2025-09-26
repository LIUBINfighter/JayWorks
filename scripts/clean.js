import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.join(__dirname, '..');
const mixDir = path.join(__dirname, 'mix');
const mainJs = path.join(repoRoot, 'main.js');
const stylesCss = path.join(repoRoot, 'styles.css');

function removeFilesInDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const itemPath = path.join(dir, item);
        try {
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
                // recurse and remove directory
                fs.rmSync(itemPath, { recursive: true, force: true });
                console.log(`removed directory: ${itemPath}`);
            } else {
                fs.unlinkSync(itemPath);
                console.log(`removed file: ${itemPath}`);
            }
        } catch (err) {
            console.error(`failed to remove ${itemPath}: ${err}`);
        }
    }
}

// Remove files in ./scripts/mix
if (fs.existsSync(mixDir)) {
    removeFilesInDir(mixDir);
} else {
    console.log(`mix directory not found: ${mixDir}`);
}

// Remove main.js and styles.css at repo root
[mainJs, stylesCss].forEach(p => {
    if (fs.existsSync(p)) {
        try {
            fs.unlinkSync(p);
            console.log(`removed: ${p}`);
        } catch (err) {
            console.error(`failed to remove ${p}: ${err}`);
        }
    } else {
        console.log(`not found: ${p}`);
    }
});
