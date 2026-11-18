#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const write = args[0] === '--write';
const htmlRoot = path.resolve(__dirname, '../html');
const mainNav = /<nav\b[^>]*\saria-label=["']Main["'][^>]*>[\s\S]*?<\/nav>/gi;
const anchor = /<a\b[^>]*>/gi;
const sequenceRel = /\srel=(["'])(prev|next)\1/i;
const href = /(\shref=)(["'])[^"']*\2/i;

function rewriteButtons(html, file, previous, next) {
    const navs = [...html.matchAll(mainNav)];
    if (navs.length !== 1) throw new Error(`Expected one main navbar in ${file}`);

    const nav = navs[0];
    const destinations = { prev: previous, next };
    const seen = new Set();
    const updated = nav[0].replace(anchor, tag => {
        const rel = tag.match(sequenceRel)?.[2].toLowerCase();
        if (!rel) return tag;
        if (seen.has(rel) || !href.test(tag)) {
            throw new Error(`Expected one ${rel} button with an href in ${file}`);
        }
        seen.add(rel);
        const relative = path.relative(path.dirname(file), destinations[rel]);
        const url = relative.split(path.sep).map(encodeURIComponent).join('/');
        return tag.replace(href, (_, attribute, quote) => `${attribute}${quote}${url}${quote}`);
    });
    if (seen.size !== 2) throw new Error(`Expected Previous and Next buttons in ${file}`);
    return html.slice(0, nav.index) + updated + html.slice(nav.index + nav[0].length);
}

try {
    if (args.length && (args.length !== 1 || !write)) {
        throw new Error('Usage: node source/scripts/update-prev-next.cjs [--write]');
    }
    const order = fs.readFileSync(path.join(__dirname, 'page-order.txt'), 'utf8')
        .split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const files = order.map(page => {
        const file = path.resolve(htmlRoot, page);
        if (path.isAbsolute(page) || !file.startsWith(htmlRoot + path.sep) || path.extname(file) !== '.html') {
            throw new Error(`Expected an HTML path relative to source/html: ${page}`);
        }
        return file;
    });
    if (files.length < 2 || new Set(files).size !== files.length) {
        throw new Error('Page order must list at least two distinct pages without duplicates.');
    }

    const changes = [];
    for (const [index, file] of files.entries()) {
        const html = fs.readFileSync(file, 'utf8');
        const previous = files[(index + files.length - 1) % files.length];
        const next = files[(index + 1) % files.length];
        const updated = rewriteButtons(html, file, previous, next);
        if (updated !== html) changes.push({ file, updated });
    }
    for (const { file, updated } of changes) {
        if (write) fs.writeFileSync(file, updated);
        console.log(`${write ? 'Updated' : 'Would update'}: ${path.relative(htmlRoot, file)}`);
    }
    console.log(`${changes.length} page(s) ${write ? 'updated' : 'would change; use --write to apply'}.`);
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
