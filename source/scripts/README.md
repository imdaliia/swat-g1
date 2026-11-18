Special-Homemade GitHub _Local_ Actions:

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

# Previous/Next updater

Edit [page-order.txt](page-order.txt) to set the reading sequence. List one path
relative to `source/html` per line, using literal spaces in folder names. The
sequence wraps from the last page back to the first. The list starts with the
site's existing reading sequence. Pages outside the list are untouched.

Preview and then apply from the repository root:

```sh
node source/scripts/update-prev-next.cjs
node source/scripts/update-prev-next.cjs --write
```

The script requires only Node.js. It updates the two button destinations in each
listed page's main navbar and checks all listed pages before writing.

Each button also gets an `aria-label` and a `title` naming its destination, such
as `"Next: Keyboard Navigation"`. Screen readers announce where the link goes
instead of "right arrow next", and mouse users see it as a tooltip. The name is
the destination's first `<h1>`, or its `<title>` without the "HCI" prefix or
suffix when the page has no `<h1>`. The visible text and arrows stay unchanged.

At the end of every listed page, right before `</main>`, the script also writes
two "Continue reading" cards with the full title of the previous and next page.
They sit between `<!-- START PAGER -->` and `<!-- STOP PAGER -->`: don't edit
them by hand, the script rewrites that block on every run. Their look lives in
[pager.css](../css/pager.css), which the script links in each page's `<head>`
right after the last stylesheet. `style.css` is not touched. On phones the
cards stack, one per row.

Rerun the script after changing a page heading so the labels and cards stay
current.
