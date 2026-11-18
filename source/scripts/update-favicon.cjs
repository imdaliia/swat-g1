#!/usr/bin/env node
// Preview: node source/scripts/update-favicon.cjs
// Apply:   node source/scripts/update-favicon.cjs --write
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--write')) {
    console.error('Usage: node source/scripts/update-favicon.cjs [--write]');
    process.exit(1);
}

const htmlRoot = path.resolve(__dirname, '../html');
const favicon = path.resolve(__dirname, '../images/favicon.svg');

function* pages(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) yield* pages(file);
        else if (entry.isFile() && entry.name.endsWith('.html')) yield file;
    }
}

function updateHead(head, file, newline) {
    // Remove existing standard favicons, including legacy rel="shortcut icon".
    // Keep other icon types such as apple-touch-icon and mask-icon.
    const withoutIcons = head.replace(/^[\t ]*<link\b[^>]*>[\t ]*(?:\r?\n)?|<link\b[^>]*>/gim, tag => {
        const rel = tag.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2];
        return rel?.toLowerCase().split(/\s+/).includes('icon') ? '' : tag;
    });
    const titles = [...withoutIcons.matchAll(/<title\b[^>]*>[\s\S]*?<\/title>/gi)];
    if (titles.length !== 1) throw new Error(`Expected one title inside the head of ${file}`);
    const title = titles[0];
    const lineStart = withoutIcons.lastIndexOf('\n', title.index) + 1;
    const indent = withoutIcons.slice(lineStart, title.index).match(/^[\t ]*/)[0];
    const href = path.relative(path.dirname(file), favicon).split(path.sep).map(encodeURIComponent).join('/');
    const titleEnd = title.index + title[0].length;
    const end = titleEnd + withoutIcons.slice(titleEnd).match(/^[\t ]*/)[0].length;
    return withoutIcons.slice(0, end)
        + `${newline}${indent}<link rel="icon" href="${href}" type="image/svg+xml">`
        + withoutIcons.slice(end);
}

try {
    if (!fs.statSync(favicon).isFile()) throw new Error('Missing source/images/favicon.svg');
    const changes = [];
    for (const file of pages(htmlRoot)) {
        const html = fs.readFileSync(file, 'utf8');
        const heads = [...html.matchAll(/<head\b[^>]*>[\s\S]*?<\/head>/gi)];
        if (!html.trim()) {
            console.log(`Skipped (empty page): ${path.relative(htmlRoot, file)}`);
            continue;
        }
        if (heads.length !== 1) throw new Error(`Expected one head in ${file}`);
        const head = heads[0];
        const newline = html.includes('\r\n') ? '\r\n' : '\n';
        const replacement = updateHead(head[0], file, newline);
        const updated = html.slice(0, head.index) + replacement + html.slice(head.index + head[0].length);
        if (updated !== html) changes.push({ file, updated });
    }
    // Plan every change before writing, so malformed pages stop the whole run.
    for (const { file, updated } of changes) {
        if (args.includes('--write')) fs.writeFileSync(file, updated);
        console.log(`${args.includes('--write') ? 'Updated' : 'Would update'}: ${path.relative(htmlRoot, file)}`);
    }
    console.log(`${changes.length} page(s) ${args.includes('--write') ? 'updated' : 'would change; use --write to apply'}.`);
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
