#!/usr/bin/env node
// Copy the homepage's main navbar to the other HTML pages.
// Preview: node source/scripts/update-navbar.cjs
// Apply:   node source/scripts/update-navbar.cjs --write
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--write')) {
    console.error('Usage: node source/scripts/update-navbar.cjs [--write]');
    process.exit(1);
}

const htmlRoot = path.resolve(__dirname, '../html');
const homepage = path.join(htmlRoot, 'index.html');
// Match only the main navigation, leaving article and demo navigation alone.
const mainNav = /<nav\b(?=[^>]*\baria-label=["']Main["'])[^>]*>[\s\S]*?<\/nav>/gi;

function navbarIn(html, file) {
    const matches = [...html.matchAll(mainNav)];
    if (matches.length > 1) throw new Error(`Multiple main navbars in ${file}`);
    return matches[0];
}

function* pages(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) yield* pages(file);
        else if (entry.isFile() && entry.name.endsWith('.html')) yield file;
    }
}

const anchor = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
const sequenceLink = /\brel=["'](?:prev|next)["']/i;
const currentAttribute = /\s+aria-current=(?:"[^"]*"|'[^']*')/gi;

function hrefIn(tag) {
    return tag.match(/\bhref=(["'])(.*?)\1/i)?.[2];
}

function linkKey(href, directory) {
    return new URL(href, `file://${directory.split(path.sep).join('/')}/`).href;
}

function navbarFor(template, existing, file) {
    const oldLinks = [...existing.matchAll(anchor)];
    const localSequence = oldLinks.filter(match => sequenceLink.test(match[0]));
    const templateSequence = [...template.matchAll(anchor)].filter(match => sequenceLink.test(match[0]));
    // Previous/Next describe the article sequence, not the shared menu.
    // Without them in the homepage, they are removed from every page: the template has no slot for them.
    if (templateSequence.length && localSequence.length !== templateSequence.length) {
        throw new Error(`Previous/Next structure differs in ${file}; review this page manually.`);
    }
    const oldCurrent = new Map();
    for (const [link] of oldLinks) {
        if (sequenceLink.test(link)) continue;
        const href = hrefIn(link);
        if (href !== undefined) {
            oldCurrent.set(linkKey(href, path.dirname(file)), link.match(currentAttribute)?.join('') || '');
        }
    }
    let sequenceIndex = 0;
    return template.replace(anchor, original => {
        if (sequenceLink.test(original)) return localSequence[sequenceIndex++][0];
        return original.replace(/<a\b[^>]*>/i, opening => {
            let destination;
            let key;
            let tag = opening.replace(currentAttribute, '');
            tag = tag.replace(/\bhref=(["'])(.*?)\1/i, (attribute, quote, href) => {
                key = linkKey(href, htmlRoot);
                // External URLs and site-root paths are already independent of page depth.
                if (!href || /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(href)) return attribute;
                const [, pathname, suffix] = href.match(/^([^?#]*)(.*)$/);
                // Decode before filesystem resolution; encode each resulting URL segment.
                destination = pathname ? path.resolve(htmlRoot, decodeURIComponent(pathname)) : homepage;
                const relative = path.relative(path.dirname(file), destination).split(path.sep).map(encodeURIComponent).join('/');
                return `href=${quote}${relative}${suffix}${quote}`;
            });
            // Retain the page's existing annotation, including intentional absence.
            // For newly added links, derive the marker from the decoded destination.
            const current = oldCurrent.has(key) ? oldCurrent.get(key)
                : destination === file && !/[?#]/.test(hrefIn(opening)) ? ' aria-current="page"' : '';
            return tag.replace(/>$/, `${current}>`);
        });
    });
}

try {
    const source = fs.readFileSync(homepage, 'utf8');
    const template = navbarIn(source, homepage);
    if (!template) throw new Error('The homepage has no navbar with aria-label="Main".');
    const changes = [];
    for (const file of pages(htmlRoot)) {
        if (file === homepage) continue;
        const html = fs.readFileSync(file, 'utf8');
        const existing = navbarIn(html, file);
        if (!existing) {
            console.log(`Skipped (no main navbar): ${path.relative(htmlRoot, file)}`);
            continue;
        }
        const newline = html.includes('\r\n') ? '\r\n' : '\n';
        const replacement = navbarFor(template[0], existing[0], file).replace(/\r?\n/g, newline);
        // Preserve original formatting when the generated markup is equivalent.
        // Attribute order stays stable; whitespace includes non-breaking spaces.
        if (replacement.replace(/\s+/g, ' ').trim() === existing[0].replace(/\s+/g, ' ').trim()) continue;
        const updated = html.slice(0, existing.index) + replacement + html.slice(existing.index + existing[0].length);
        if (updated !== html) changes.push({ file, updated });
    }
    // Validate every page before writing any changes.
    for (const { file, updated } of changes) {
        if (args.includes('--write')) fs.writeFileSync(file, updated);
        console.log(`${args.includes('--write') ? 'Updated' : 'Would update'}: ${path.relative(htmlRoot, file)}`);
    }
    console.log(`${changes.length} page(s) ${args.includes('--write') ? 'updated' : 'would change; use --write to apply'}.`);
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
