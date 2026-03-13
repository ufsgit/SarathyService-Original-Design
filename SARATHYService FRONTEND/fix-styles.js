const fs = require('fs');
const path = require('path');

// Files that still have inline styles
const files = [
    'src/app/shared/layouts/staff-layout/staff-layout.component.ts',
    'src/app/shared/layouts/admin-layout/admin-layout.component.ts',
    'src/app/features/dashboard/staff-dashboard.component.ts',
    'src/app/features/dashboard/dashboard.component.ts',
    'src/app/features/auth/login/login.component.ts',
];

for (const relPath of files) {
    const fullPath = path.join(__dirname, relPath);
    let content = fs.readFileSync(fullPath, 'utf-8');
    const basename = path.basename(fullPath, '.ts');

    // Already has styleUrls? Skip
    if (content.includes('styleUrls:')) {
        console.log(`SKIP (already has styleUrls): ${relPath}`);
        continue;
    }

    // Replace styles: [`...`] with styleUrls: ['./basename.css']
    // Use a more flexible regex that handles \r\n properly
    const stylesRegex = /styles:\s*\[\s*`[\s\S]*?`\s*\]/;
    const match = content.match(stylesRegex);

    if (!match) {
        console.log(`SKIP (no inline styles found): ${relPath}`);
        continue;
    }

    content = content.replace(stylesRegex, `styleUrls: ['./${basename}.css']`);
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`DONE: ${relPath}`);
}

console.log('\nAll styles extracted!');
