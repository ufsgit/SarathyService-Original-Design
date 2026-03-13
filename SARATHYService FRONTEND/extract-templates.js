const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'src', 'app');

// Find all .component.ts files recursively
function findComponents(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...findComponents(full));
        else if (entry.name.endsWith('.component.ts')) results.push(full);
    }
    return results;
}

function extractTemplate(content) {
    const match = content.match(/(\s+)template:\s*`([\s\S]*?)`(\s*,?\s*)/);
    if (!match) return null;
    return { full: match[0], indent: match[1], html: match[2], trailing: match[3] };
}

function extractStyles(content) {
    const match = content.match(/(\s+)styles:\s*\[\s*`([\s\S]*?)`\s*\](\s*)/);
    if (!match) return null;
    return { full: match[0], indent: match[1], css: match[2], trailing: match[3] };
}

const components = findComponents(BASE);
let processed = 0;
let skipped = 0;

for (const compFile of components) {
    const content = fs.readFileSync(compFile, 'utf-8');
    const dir = path.dirname(compFile);
    const basename = path.basename(compFile, '.ts');

    if (content.includes('templateUrl:')) {
        console.log(`SKIP (already external): ${path.relative(BASE, compFile)}`);
        skipped++;
        continue;
    }

    const tmpl = extractTemplate(content);
    const styl = extractStyles(content);

    if (!tmpl) {
        console.log(`SKIP (no inline template): ${path.relative(BASE, compFile)}`);
        skipped++;
        continue;
    }

    let newContent = content;

    // Extract template
    const htmlFile = path.join(dir, basename + '.html');
    let html = tmpl.html;
    const lines = html.split('\n');
    let minIndent = Infinity;
    for (const line of lines) {
        if (line.trim().length > 0) {
            const indent = line.match(/^(\s*)/)[1].length;
            minIndent = Math.min(minIndent, indent);
        }
    }
    if (minIndent < Infinity && minIndent > 0) {
        html = lines.map(l => l.substring(Math.min(minIndent, l.length))).join('\n');
    }
    html = html.replace(/^\n+/, '').replace(/\n+$/, '') + '\n';
    fs.writeFileSync(htmlFile, html, 'utf-8');

    newContent = newContent.replace(tmpl.full, `${tmpl.indent}templateUrl: './${basename}.html',\n`);

    if (styl) {
        const cssFile = path.join(dir, basename + '.css');
        let css = styl.css;
        const cssLines = css.split('\n');
        let minCssIndent = Infinity;
        for (const line of cssLines) {
            if (line.trim().length > 0) {
                const indent = line.match(/^(\s*)/)[1].length;
                minCssIndent = Math.min(minCssIndent, indent);
            }
        }
        if (minCssIndent < Infinity && minCssIndent > 0) {
            css = cssLines.map(l => l.substring(Math.min(minCssIndent, l.length))).join('\n');
        }
        css = css.replace(/^\n+/, '').replace(/\n+$/, '') + '\n';
        fs.writeFileSync(cssFile, css, 'utf-8');

        newContent = newContent.replace(styl.full, `${styl.indent}styleUrls: ['./${basename}.css']\n`);
    }

    fs.writeFileSync(compFile, newContent, 'utf-8');
    console.log(`DONE: ${path.relative(BASE, compFile)}`);
    processed++;
}

console.log(`\nProcessed: ${processed}, Skipped: ${skipped}`);
