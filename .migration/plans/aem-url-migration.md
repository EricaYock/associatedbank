# Associated Bank Migration Plan

## Overview

Migrate two Associated Bank pages to AEM Edge Delivery Services, including page content, header/navigation, footer, and design system styling.

**Source URLs:**
1. `https://www.associatedbank.com/` (Homepage)
2. `https://www.associatedbank.com/personal/personal-checking` (Personal Checking)

## Current Project State

- AEM EDS boilerplate is set up with 16 standard blocks (accordion, cards, carousel, columns, embed, footer, form, fragment, header, hero, modal, quote, search, table, tabs, video)
- No page content migrated yet
- No `page-templates.json` or `metadata.json` exists
- Footer has placeholder content only
- Fonts currently set to Roboto; need to switch to Metropolis (Associated Bank brand font)

## Page Analysis Summary

### Homepage (`/`)
| Section | Block Candidate | Notes |
|---------|----------------|-------|
| Hero with savings promo + login widget | `hero` variant | Split layout: promo left, login form right |
| Product category cards (6-up) | `cards` variant | Icon + title + description grid |
| Merger announcement banner | `columns` or default content | Navy blue background, centered text + image |
| Business/Wealth/Commercial cards (3-up) | `cards` variant | Dark background, linked cards |
| Alternating content+image promos (x4) | `columns` variant | Left/right alternating image+text with CTAs |
| Mobile app promo | `columns` variant | Phone mockup + app store badges |
| Customer care section | `columns` variant | 3-column contact methods |
| Educational article cards (4-up) | `cards` variant | Thumbnail + title article links |
| Disclosures | Default content | Legal footnotes |

### Personal Checking (`/personal/personal-checking`)
| Section | Block Candidate | Notes |
|---------|----------------|-------|
| Hero banner with H1 | `hero` variant | Product-focused, lifestyle image with diagonal overlay |
| Intro value proposition | Default content | Light aqua background strip |
| Product comparison cards (3-up) | `cards` variant | Green header, benefits list, CTA buttons |
| Comparison table | `table` | Full HTML table with feature matrix |
| "Find Your Fit" CTA banner | Default content or `columns` | Green background, single CTA |
| Benefits grid (8-pack icons) | `cards` variant | 4x2 grid of icon benefit cards |
| Digital banking features | `columns` variant | Feature list + phone mockup |
| In-person CTA | Default content | Simple heading + button |
| Disclosures | Default content | Extensive footnotes |

### Navigation & Footer
- **Header**: Two-tier nav (utility bar + primary nav with mega-menu dropdowns)
- **Footer**: 4-zone layout (tagline, info columns, link rows, legal bar)

## Design System Tokens

| Token | Value |
|-------|-------|
| Primary brand green | `#007A2F` |
| Dark green | `#00441A` |
| CTA navy blue | `#12207B` |
| Accent teal | `#8AD2D5` |
| Lime green accent | `#AAD04E` |
| Announcement blue | `#1D4F91` |
| Body text dark grey | `#595959` |
| Primary font | Metropolis (Regular, Bold, Semibold) |
| Secondary font | Source Sans Pro |
| Button border-radius | 7-9px |

## Migration Strategy

The migration will use the **`excat-site-migration`** skill which orchestrates:
1. Site analysis to create page templates
2. Per-page analysis to identify block variants and sections
3. Block mapping with DOM selectors
4. Import infrastructure generation (parsers + transformers)
5. Content import and verification
6. Design system extraction and styling
7. Navigation and footer setup

### Block Variant Approach
- Blocks shared across pages (e.g., `cards`, `columns`) will use similarity matching (70% threshold) to reuse variants where possible
- Unique layouts get dedicated variants (e.g., `hero-homepage` vs `hero-product`)

## Checklist

- [ ] **Site analysis** -- Classify URLs into page templates, create `page-templates.json`
- [ ] **Homepage analysis** -- Analyze sections, blocks, and DOM selectors for `https://www.associatedbank.com/`
- [ ] **Personal checking analysis** -- Analyze sections, blocks, and DOM selectors for `https://www.associatedbank.com/personal/personal-checking`
- [ ] **Block mapping** -- Map DOM selectors to block variants in `page-templates.json`
- [ ] **Import infrastructure** -- Generate block parsers and page transformers
- [ ] **Homepage content import** -- Import and verify homepage content HTML
- [ ] **Personal checking content import** -- Import and verify personal checking content HTML
- [ ] **Design system migration** -- Extract and apply colors, fonts, spacing, and button styles
- [ ] **Navigation setup** -- Migrate header/nav structure to EDS `nav.html`
- [ ] **Footer migration** -- Migrate footer content and structure
- [ ] **Block styling** -- Implement CSS for all block variants to match original design
- [ ] **Visual validation** -- Preview all pages and compare against originals

## Execution

> This plan requires **Execute mode** to implement. Switch out of Plan mode to begin the migration workflow using the `excat-site-migration` skill.
