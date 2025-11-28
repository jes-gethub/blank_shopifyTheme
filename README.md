# Blank Shopify Theme

A minimal, conflict-free Shopify theme built for custom sections.

## Installation

1. Download this repository as ZIP
2. Remove .gitkeep files and README.md
3. Re-zip the contents
4. Upload to Shopify: Admin → Online Store → Themes → Add theme → Upload ZIP

## Structure

- `/layout` - Main theme layout
- `/templates` - Page templates (all blank JSON)
- `/sections` - Custom sections go here
- `/assets` - CSS, JS, images
- `/config` - Theme settings
- `/locales` - Translation files

## Development

Using Shopify CLI:
```bash
shopify theme dev
```

## Adding Sections

All custom sections should use scoped styling with {{ section.id }} to prevent conflicts.
