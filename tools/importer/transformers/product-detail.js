/* eslint-disable */
/* global WebImporter */

/**
 * Product Detail page transformer for Associated Bank personal checking page.
 *
 * Orchestrates the page-level import for the product-detail template
 * by processing each section, invoking inline block parsers, inserting
 * section breaks, and appending section-metadata / page-metadata blocks.
 *
 * Section map:
 *   Section 1  - Hero               (.hero-image)                     - hero-banner
 *   Section 2  - Intro              (.intro-section-container)        - columns-feature  [style: teal]
 *   Section 3  - Product Cards      (#padded-container0)              - h2 default + cards-pricing + p default
 *   Section 4  - Comparison Table   (#CompBox)                        - table-comparison  [style: green]
 *   Section 5  - Find Your Fit CTA  (#padded-container4)              - default (h2+button)  [style: green]
 *   Section 6  - Benefits Grid      (#8pack)                          - h2 default + cards-benefit
 *   Section 7  - Digital Banking    (#padded-container6)              - columns-feature  [style: teal]
 *   Section 8  - In-Person CTA      (#padded-container8)              - default (h2+link)
 *   Section 9  - Contact Info       (.left-panel-link-container)      - columns-contact  [style: green]
 *   Section 10 - Disclosures        (#disclosures)                    - default (ol/ul)
 */

const SECTIONS = [
  {
    id: 'section-1',
    name: 'Hero',
    selector: '.hero-image',
    style: null,
    blocks: ['hero-banner'],
    defaultContent: [],
  },
  {
    id: 'section-2',
    name: 'Intro',
    selector: '.intro-section-container',
    style: 'teal',
    blocks: ['columns-feature'],
    defaultContent: [],
  },
  {
    id: 'section-3',
    name: 'Product Cards',
    selector: '#padded-container0',
    style: null,
    blocks: ['cards-pricing'],
    defaultContent: [],
  },
  {
    id: 'section-4',
    name: 'Comparison Table',
    selector: '#CompBox',
    style: 'green',
    blocks: ['table-comparison'],
    defaultContent: [],
  },
  {
    id: 'section-5',
    name: 'Find Your Fit CTA',
    selector: '#padded-container4',
    style: 'green',
    blocks: [],
    defaultContent: [],
  },
  {
    id: 'section-6',
    name: 'Benefits Grid',
    selector: '[id="8pack"]',
    style: null,
    blocks: ['cards-benefit'],
    defaultContent: [],
  },
  {
    id: 'section-7',
    name: 'Digital Banking Feature',
    selector: '#padded-container6',
    style: 'teal',
    blocks: ['columns-feature-digital'],
    defaultContent: [],
  },
  {
    id: 'section-8',
    name: 'In-Person CTA',
    selector: '#padded-container8',
    style: null,
    blocks: [],
    defaultContent: [],
  },
  {
    id: 'section-9',
    name: 'Contact Info',
    selector: '.left-panel-link-container',
    style: 'green',
    blocks: ['columns-contact'],
    defaultContent: [],
  },
  {
    id: 'section-10',
    name: 'Disclosures',
    selector: '#disclosures',
    style: null,
    blocks: [],
    defaultContent: [],
  },
];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function createBlock(document, name, rows) {
  const table = document.createElement('table');
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.textContent = name;
  headerCell.colSpan = (rows.length > 0 && rows[0].length) || 1;
  headerRow.append(headerCell);
  table.append(headerRow);

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cellContent) => {
      const td = document.createElement('td');
      if (typeof cellContent === 'string') {
        td.textContent = cellContent;
      } else if (cellContent instanceof Element || cellContent instanceof DocumentFragment) {
        td.append(cellContent);
      }
      tr.append(td);
    });
    table.append(tr);
  });

  return table;
}

function createSectionBreak(document) {
  return document.createElement('hr');
}

function createSectionMetadata(document, style) {
  return createBlock(document, 'Section Metadata', [['style', style]]);
}

function createMetadata(document, metadata) {
  const rows = Object.entries(metadata).map(([key, value]) => {
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
      if (/\.(png|jpe?g|gif|svg|webp)(\?|$)/i.test(value)) {
        const img = document.createElement('img');
        img.setAttribute('src', value);
        return [key, img];
      }
      const a = document.createElement('a');
      a.setAttribute('href', value);
      a.textContent = value;
      return [key, a];
    }
    return [key, value];
  });
  return createBlock(document, 'Metadata', rows);
}

function extractPageMetadata(document) {
  const meta = {};
  const title = document.querySelector('title');
  if (title) meta.Title = title.textContent.trim();

  const description =
    document.querySelector('meta[name="description"]') ||
    document.querySelector('meta[property="og:description"]');
  if (description) meta.Description = description.getAttribute('content') || '';

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) meta['og:image'] = ogImage.getAttribute('content') || '';

  return meta;
}

// ---------------------------------------------------------------------------
// Inline block parsers
// ---------------------------------------------------------------------------

function parseHeroBanner(element, { document }) {
  const h1 = element.querySelector('h1');

  const cellFrag = document.createDocumentFragment();
  if (h1) {
    const heading = document.createElement('h1');
    heading.textContent = h1.textContent.trim();
    cellFrag.appendChild(heading);
  }

  const cells = [['', '', cellFrag]];
  return createBlock(document, 'Hero Banner', cells);
}

function parseColumnsFeatureIntro(element, { document }) {
  // Intro section: text paragraph on one side, image on the other
  const introText = element.querySelector('.intro-bigger');
  const introImg = element.querySelector('img.hide-tablet') || element.querySelector('img.gray-frame');

  const textFrag = document.createDocumentFragment();
  if (introText) {
    const p = document.createElement('p');
    // Get just the text content (span text), not image alt
    const spans = introText.querySelectorAll('span span');
    if (spans.length > 0) {
      p.textContent = spans[spans.length - 1].textContent.trim();
    } else {
      p.textContent = introText.textContent.trim();
    }
    textFrag.appendChild(p);
  }

  const imageFrag = document.createDocumentFragment();
  if (introImg) {
    const newImg = document.createElement('img');
    newImg.setAttribute('src', introImg.getAttribute('src') || '');
    newImg.setAttribute('alt', introImg.getAttribute('alt') || '');
    imageFrag.appendChild(newImg);
  }

  return createBlock(document, 'Columns (feature)', [[imageFrag, textFrag]]);
}

function parseCardsPricing(sectionEl, { document }) {
  const results = [];

  // Default content: H2 heading
  const h2 = sectionEl.querySelector('#paragraph_0 h2, .paragraph h2');
  if (h2) {
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim();
    results.push(heading);
  }

  // Product cards
  const cards = sectionEl.querySelectorAll('.product-tile-block');
  if (cards.length > 0) {
    const cells = [];
    cards.forEach((card) => {
      const cellFrag = document.createDocumentFragment();

      // Category label
      const label = card.querySelector('.title-block p');
      if (label) {
        const p = document.createElement('p');
        p.textContent = label.textContent.trim();
        cellFrag.appendChild(p);
      }

      // Product name heading
      const cardH2 = card.querySelector('.title-block h2');
      if (cardH2) {
        const heading = document.createElement('h3');
        heading.textContent = cardH2.textContent.trim();
        cellFrag.appendChild(heading);
      }

      // Benefits list
      const benefitsP = card.querySelector('.product-checklist .paragraph p strong');
      if (benefitsP) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = 'Benefits';
        p.appendChild(strong);
        cellFrag.appendChild(p);
      }
      const ul = card.querySelector('.product-checklist ul');
      if (ul) {
        const newUl = document.createElement('ul');
        ul.querySelectorAll('li').forEach((li) => {
          const newLi = document.createElement('li');
          newLi.textContent = li.textContent.trim();
          newUl.appendChild(newLi);
        });
        cellFrag.appendChild(newUl);
      }

      // Fee details
      const feeP = card.querySelector('.product-checklist .paragraph hr + p');
      if (feeP) {
        const p = document.createElement('p');
        p.textContent = feeP.textContent.trim();
        cellFrag.appendChild(p);
      }

      // CTA button
      const cta = card.querySelector('.product-checklist a.primary-button');
      if (cta) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', cta.getAttribute('href') || '');
        a.textContent = cta.textContent.trim();
        p.appendChild(a);
        cellFrag.appendChild(p);
      }

      cells.push(['', cellFrag]);
    });

    results.push(createBlock(document, 'Cards (pricing)', cells));
  }

  // Upsell paragraph
  const upsellP = sectionEl.querySelector('#paragraph_4 p');
  if (upsellP) {
    const p = document.createElement('p');
    const link = upsellP.querySelector('a');
    if (link) {
      const textBefore = upsellP.childNodes[0]?.textContent?.trim() || '';
      if (textBefore) p.appendChild(document.createTextNode(textBefore + ' '));
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href') || '');
      a.textContent = link.textContent.trim();
      p.appendChild(a);
      // text after link
      const textAfter = upsellP.lastChild?.textContent?.trim() || '';
      if (textAfter && textAfter !== link.textContent.trim()) {
        p.appendChild(document.createTextNode(' ' + textAfter));
      }
    } else {
      p.textContent = upsellP.textContent.trim();
    }
    results.push(p);
  }

  return results;
}

function parseTableComparison(sectionEl, { document }) {
  const table = sectionEl.querySelector('.updatedTableStyle table');
  if (!table) return null;

  // Clone the table and clean it
  const newTable = document.createElement('table');

  // Header row
  const thead = table.querySelector('thead');
  if (thead) {
    const headerRow = thead.querySelector('tr');
    if (headerRow) {
      const tr = document.createElement('tr');
      headerRow.querySelectorAll('th').forEach((th) => {
        const newTh = document.createElement('th');
        newTh.textContent = th.textContent.trim();
        tr.appendChild(newTh);
      });
      newTable.appendChild(tr);
    }
  }

  // Data rows
  const tbody = table.querySelector('tbody');
  if (tbody) {
    tbody.querySelectorAll('tr').forEach((row) => {
      const tr = document.createElement('tr');
      row.querySelectorAll('th, td').forEach((cell) => {
        const td = document.createElement('td');
        // Preserve links
        const link = cell.querySelector('a');
        if (link) {
          const a = document.createElement('a');
          a.setAttribute('href', link.getAttribute('href') || '');
          a.textContent = link.textContent.trim();
          td.appendChild(a);
        } else if (cell.querySelector('ul')) {
          const ul = document.createElement('ul');
          cell.querySelectorAll('li').forEach((li) => {
            const newLi = document.createElement('li');
            newLi.textContent = li.textContent.trim();
            ul.appendChild(newLi);
          });
          td.appendChild(ul);
        } else {
          td.textContent = cell.textContent.trim();
        }
        tr.appendChild(td);
      });
      newTable.appendChild(tr);
    });
  }

  // Wrap in a block table
  const blockTable = document.createElement('table');
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.textContent = 'Table (comparison)';
  headerRow.appendChild(headerCell);
  blockTable.appendChild(headerRow);

  const contentRow = document.createElement('tr');
  const contentCell = document.createElement('td');
  contentCell.appendChild(newTable);
  contentRow.appendChild(contentCell);
  blockTable.appendChild(contentRow);

  return blockTable;
}

function parseFindYourFitCTA(sectionEl, { document }) {
  const results = [];
  const h2 = sectionEl.querySelector('h2');
  if (h2) {
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim();
    results.push(heading);
  }
  const btn = sectionEl.querySelector('.buttonGroup button, .buttonGroup a');
  if (btn) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = btn.textContent.trim();
    p.appendChild(strong);
    results.push(p);
  }
  return results;
}

function parseCardsBenefit(sectionEl, { document }) {
  const results = [];

  // H2 heading
  const h2 = sectionEl.querySelector('h2');
  if (h2) {
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim();
    results.push(heading);
  }

  // Benefit items from .blip elements
  const blips = sectionEl.querySelectorAll('.blip');
  if (blips.length > 0) {
    const cells = [];
    blips.forEach((blip) => {
      const cellFrag = document.createDocumentFragment();
      const link = blip.querySelector('a.imageLink');
      const headingP = blip.querySelector('.heading');
      const subHeadingP = blip.querySelector('.subHeading');

      if (headingP) {
        const h3 = document.createElement('h3');
        if (link) {
          const a = document.createElement('a');
          a.setAttribute('href', link.getAttribute('href') || '');
          a.textContent = headingP.textContent.trim();
          h3.appendChild(a);
        } else {
          h3.textContent = headingP.textContent.trim();
        }
        cellFrag.appendChild(h3);
      }
      if (subHeadingP) {
        const p = document.createElement('p');
        p.textContent = subHeadingP.textContent.trim();
        cellFrag.appendChild(p);
      }
      cells.push(['', cellFrag]);
    });

    results.push(createBlock(document, 'Cards (benefit)', cells));
  }

  return results;
}

function parseColumnsFeatureDigital(sectionEl, { document }) {
  const results = [];

  // H2 heading above the columns
  const h2 = sectionEl.querySelector('h2');
  if (h2) {
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim();
    results.push(heading);
  }

  const columnar = sectionEl.querySelector('.columnarContainer');
  if (!columnar) return results;

  const cols = columnar.querySelectorAll('[class*="columnar-container"]');
  const colFrags = [];

  cols.forEach((col) => {
    const frag = document.createDocumentFragment();
    const img = col.querySelector('.imageContainer img');
    const paragraphs = col.querySelectorAll('.paragraph p');

    if (img) {
      const newImg = document.createElement('img');
      newImg.setAttribute('src', img.getAttribute('src') || '');
      newImg.setAttribute('alt', img.getAttribute('alt') || '');
      frag.appendChild(newImg);
    } else if (paragraphs.length > 0) {
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (text) {
          const newP = document.createElement('p');
          const strong = p.querySelector('strong');
          if (strong) {
            const newStrong = document.createElement('strong');
            newStrong.textContent = strong.textContent.trim();
            newP.appendChild(newStrong);
            // Get text after the strong/br
            const br = p.querySelector('br');
            if (br && br.nextSibling) {
              newP.appendChild(document.createElement('br'));
              newP.appendChild(document.createTextNode(br.nextSibling.textContent.trim()));
            }
          } else {
            newP.textContent = text;
          }
          frag.appendChild(newP);
        }
      });
    }
    colFrags.push(frag);
  });

  if (colFrags.length > 0) {
    results.push(createBlock(document, 'Columns (feature)', [colFrags]));
  }

  return results;
}

function parseInPersonCTA(sectionEl, { document }) {
  const results = [];
  const h2 = sectionEl.querySelector('h2');
  if (h2) {
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim();
    results.push(heading);
  }
  const cta = sectionEl.querySelector('.btn_container a');
  if (cta) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', cta.getAttribute('href') || '');
    a.textContent = cta.textContent.trim();
    p.appendChild(a);
    results.push(p);
  }
  return results;
}

function parseColumnsContact(sectionEl, { document }) {
  const frag = document.createDocumentFragment();

  // H2 heading
  const h2 = sectionEl.querySelector('h2');
  if (h2) {
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim();
    frag.appendChild(heading);
  }

  // Hours
  const hoursPs = sectionEl.querySelectorAll('#paragraph_11 p');
  hoursPs.forEach((p) => {
    const text = p.textContent.trim();
    if (text) {
      const newP = document.createElement('p');
      newP.textContent = text;
      frag.appendChild(newP);
    }
  });

  // Phone link
  const phoneLink = sectionEl.querySelector('a[href^="tel:"]');
  if (phoneLink) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', phoneLink.getAttribute('href') || '');
    a.textContent = phoneLink.textContent.trim();
    p.appendChild(a);
    frag.appendChild(p);
  }

  // Schedule CTA
  const cta = sectionEl.querySelector('a.secondary-button, a.primary-button');
  if (cta) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', cta.getAttribute('href') || '');
    a.textContent = cta.textContent.trim();
    p.appendChild(a);
    frag.appendChild(p);
  }

  return createBlock(document, 'Columns (contact)', [[frag]]);
}

function parseDisclosures(sectionEl, { document }) {
  const results = [];
  const ol = sectionEl.querySelector('ol');
  if (ol) {
    const newOl = document.createElement('ol');
    ol.querySelectorAll('li').forEach((li) => {
      const newLi = document.createElement('li');
      const p = li.querySelector('p');
      if (p) {
        const newP = document.createElement('p');
        // Preserve links inside
        newP.innerHTML = '';
        p.childNodes.forEach((child) => {
          if (child.nodeType === 3) {
            newP.appendChild(document.createTextNode(child.textContent));
          } else if (child.nodeName === 'A') {
            const a = document.createElement('a');
            a.setAttribute('href', child.getAttribute('href') || '');
            a.textContent = child.textContent.trim();
            newP.appendChild(a);
          } else {
            newP.appendChild(document.createTextNode(child.textContent));
          }
        });
        newLi.appendChild(newP);
      } else {
        newLi.textContent = li.textContent.trim();
      }
      newOl.appendChild(newLi);
    });
    results.push(newOl);
  }

  // Trademark list
  const ul = sectionEl.querySelector('ul');
  if (ul) {
    const newUl = document.createElement('ul');
    ul.querySelectorAll('li').forEach((li) => {
      const newLi = document.createElement('li');
      newLi.textContent = li.textContent.trim();
      newUl.appendChild(newLi);
    });
    results.push(newUl);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Section-to-parser mapping
// ---------------------------------------------------------------------------

const SECTION_HANDLERS = {
  'section-1': (sectionEl, ctx) => [parseHeroBanner(sectionEl, ctx)],
  'section-2': (sectionEl, ctx) => [parseColumnsFeatureIntro(sectionEl, ctx)],
  'section-3': (sectionEl, ctx) => parseCardsPricing(sectionEl, ctx),
  'section-4': (sectionEl, ctx) => {
    const table = parseTableComparison(sectionEl, ctx);
    return table ? [table] : [];
  },
  'section-5': (sectionEl, ctx) => parseFindYourFitCTA(sectionEl, ctx),
  'section-6': (sectionEl, ctx) => parseCardsBenefit(sectionEl, ctx),
  'section-7': (sectionEl, ctx) => parseColumnsFeatureDigital(sectionEl, ctx),
  'section-8': (sectionEl, ctx) => parseInPersonCTA(sectionEl, ctx),
  'section-9': (sectionEl, ctx) => [parseColumnsContact(sectionEl, ctx)],
  'section-10': (sectionEl, ctx) => parseDisclosures(sectionEl, ctx),
};

// ---------------------------------------------------------------------------
// Main transformer
// ---------------------------------------------------------------------------

export default function transform(hookName, element, payload) {
  const { document, url } = payload;

  if (hookName === 'beforeTransform') {
    const removeSelectors = [
      'header',
      'nav',
      'footer',
      '.globalNav',
      '.globalFooter',
      '#signInModal',
      '.modal-button-modal',
      '.modal',
      '.overlay',
      '.signInBox-container',
      '.LeftProductAd',
      '.mobile-personal-checking-comparison',
    ];
    removeSelectors.forEach((sel) => {
      const els = document.querySelectorAll(sel);
      els.forEach((el) => el.remove());
    });
  }

  if (hookName === 'afterTransform') {
    const results = [];

    SECTIONS.forEach((section, index) => {
      const sectionEl = document.querySelector(section.selector);
      if (!sectionEl) return;

      if (index > 0) {
        results.push(createSectionBreak(document));
      }

      const handler = SECTION_HANDLERS[section.id];
      if (handler) {
        const nodes = handler(sectionEl, { document });
        if (nodes) {
          nodes.forEach((node) => {
            if (node) results.push(node);
          });
        }
      }

      if (section.style) {
        results.push(createSectionMetadata(document, section.style));
      }
    });

    // Page metadata
    const pageMeta = extractPageMetadata(document);
    if (Object.keys(pageMeta).length > 0) {
      results.push(createSectionBreak(document));
      results.push(createMetadata(document, pageMeta));
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    results.forEach((node) => {
      element.appendChild(node);
    });
  }

  return element;
}
