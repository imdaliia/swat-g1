# Navbar updater

Edit the main navbar in [the homepage](../html/index.html), then preview propagation from the repository root:

```sh
node source/scripts/update-navbar.cjs
```

Apply the changes:

```sh
node source/scripts/update-navbar.cjs --write
```

Requires Node.js and no packages. Paths are resolved relative to the script, so it also works from another working directory.

The updater recursively visits `source/html`, replaces only navigation with `aria-label="Main"`, and adjusts relative links (including homepage fragments and folders with spaces). It preserves each page's Previous/Next links and existing current-page annotations, including absent annotations. Newly added links receive `aria-current="page"` when their decoded destination is the current page. External and site-root URLs stay unchanged. Pages without a main navbar, including empty placeholders, are reported and skipped. Demo examples remain intact. A mismatch in the number of Previous/Next links stops the updater before it writes any pages, for manual review.

The homepage is the template and is never rewritten. Review its links before applying: any placeholders in it are copied too. Preview mode does not write files. Equivalent markup retains its original formatting, so running against the current pages produces zero changes; repeated application also produces no further changes.

# Favicon updater

Place the SVG favicon immediately below the title in every HTML page, including the homepage. Preview from the repository root:

```sh
node source/scripts/update-favicon.cjs
```

Apply:

```sh
node source/scripts/update-favicon.cjs --write
```

The script computes the relative path to [favicon.svg](../images/favicon.svg) for each page. It replaces existing standard favicon links without duplicating them, preserves other icon types, and leaves the body untouched. Empty pages are skipped; malformed nonempty pages stop the run before any files are written. Like the navbar updater, it requires only Node.js, works from any working directory, and previews by default.
