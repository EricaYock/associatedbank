/* eslint-disable */
/* global WebImporter */

/**
 * Homepage transformer for Associated Bank AEM EDS migration.
 *
 * Orchestrates the page-level import for https://www.associatedbank.com/
 * by processing each section defined in page-templates.json, invoking
 * the appropriate block parsers, inserting section breaks (---) between
 * sections, and appending section-metadata / page-metadata blocks.
 *
 * Section map (from page-templates.json):
 *
 *   Section 1  - Hero            (.homepageHero)              - hero-banner
 *   Section 2  - Product Categories (#Newvisual_products)     - h2 default + cards-product
 *   Section 3  - Merger Announcement (#padded-container0)     - columns-announcement  [style: navy-blue]
 *   Section 4  - Business/Wealth  (#padded-container1)        - h2 default + cards-link  [style: dark]
 *   Section 5  - Home Loans       (#padded-container2)        - columns-feature
 *   Section 6  - Checking         (#padded-container3)        - columns-feature        [style: teal]
 *   Section 7  - Credit Cards     (#padded-container4)        - columns-feature
 *   Section 8  - Digital Banking  (#padded-container5)        - columns-feature
 *   Section 9  - Customer Care    (#padded-container6)        - h2 default + columns-contact  [style: green]
 *   Section 10 - Articles         (#padded-container7)        - h2 default + cards-article
 *   Section 11 - Disclosures      (#disclosures)              - default (ol/ul)
 */

/**
 * Section configuration derived from page-templates.json and authoring-analysis.json.
 * Each entry describes one section of the homepage in DOM order.
 */
const SECTIONS = [
  {
    id: 'section-1',
    name: 'Hero',
    selector: '.homepageHero',
    style: null,
    blocks: ['hero-banner'],
    defaultContent: [],
  },
  {
    id: 'section-2',
    name: 'Product Categories',
    selector: '#Newvisual_products',
    style: null,
    blocks: ['cards-product'],
    defaultContent: ['h2'],
  },
  {
    id: 'section-3',
    name: 'Merger Announcement',
    selector: '#padded-container0',
    style: 'navy-blue',
    blocks: ['columns-announcement'],
    defaultContent: [],
  },
  {
    id: 'section-4',
    name: 'Business/Wealth/Commercial',
    selector: '#padded-container1',
    style: 'dark',
    blocks: ['cards-link'],
    defaultContent: ['h2'],
  },
  {
    id: 'section-5',
    name: 'Home Loans Feature',
    selector: '#padded-container2',
    style: null,
    blocks: ['columns-feature'],
    defaultContent: [],
  },
  {
    id: 'section-6',
    name: 'Checking Feature',
    selector: '#padded-container3',
    style: 'teal',
    blocks: ['columns-feature'],
    defaultContent: [],
  },
  {
    id: 'section-7',
    name: 'Credit Cards Feature',
    selector: '#padded-container4',
    style: null,
    blocks: ['columns-feature'],
    defaultContent: [],
  },
  {
    id: 'section-8',
    name: 'Digital Banking / Mobile App',
    selector: '#padded-container5',
    style: null,
    blocks: ['columns-feature'],
    defaultContent: [],
  },
  {
    id: 'section-9',
    name: 'Customer Care',
    selector: '#padded-container6',
    style: 'green',
    blocks: ['columns-contact'],
    defaultContent: ['h2'],
  },
  {
    id: 'section-10',
    name: 'Educational Articles',
    selector: '#padded-container7',
    style: null,
    blocks: ['cards-article'],
    defaultContent: ['h2'],
  },
  {
    id: 'section-11',
    name: 'Disclosures',
    selector: '#disclosures',
    style: null,
    blocks: [],
    defaultContent: ['ol', 'ul'],
  },
];

// ---------------------------------------------------------------------------
// Inline utility helpers
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
  const content = element.querySelector('.desktopContent') || element;
  const h1 = content.querySelector('h1');
  const textContainer = content.querySelector('.textContent');
  let paragraphText = '';
  if (textContainer) {
    const clone = textContainer.cloneNode(true);
    const innerH1 = clone.querySelector('h1');
    if (innerH1) innerH1.remove();
    paragraphText = clone.textContent.trim();
  }
  const ctaLink = content.querySelector('.buttonContainer a');

  // Column 1: background image wrapped in <picture> (imageAlt collapsed into image via alt attribute)
  const imageFrag = document.createDocumentFragment();
  const heroImg = element.querySelector('.responsiveImageDesktop img') || element.querySelector('img');
  if (heroImg) {
    const picture = document.createElement('picture');
    const newImg = document.createElement('img');
    newImg.setAttribute('src', heroImg.getAttribute('src') || '');
    newImg.setAttribute('alt', heroImg.getAttribute('alt') || '');
    picture.appendChild(newImg);
    imageFrag.appendChild(picture);
  }

  // Column 3: text content
  const textFrag = document.createDocumentFragment();
  if (h1) {
    const heading = document.createElement('h1');
    heading.textContent = h1.textContent.trim();
    textFrag.appendChild(heading);
  }
  if (paragraphText) {
    const p = document.createElement('p');
    p.textContent = paragraphText;
    textFrag.appendChild(p);
  }
  if (ctaLink) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', ctaLink.getAttribute('href') || '');
    a.textContent = ctaLink.textContent.trim();
    p.appendChild(a);
    textFrag.appendChild(p);
  }

  const cells = [[imageFrag], [textFrag]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero Banner', cells });
  element.replaceWith(block);
}

function parseCardsProduct(element, { document }) {
  const products = element.querySelectorAll('.visualProduct');
  if (!products.length) return;

  const cells = [];
  products.forEach((product) => {
    const imageFrag = document.createDocumentFragment();
    const img = product.querySelector('img.primary-icon');
    if (img) {
      const newImg = document.createElement('img');
      newImg.setAttribute('src', img.getAttribute('src') || '');
      newImg.setAttribute('alt', img.getAttribute('alt') || '');
      imageFrag.appendChild(newImg);
    }

    const textFrag = document.createDocumentFragment();
    const productName = product.querySelector('.product-text');
    if (productName) {
      const h3 = document.createElement('h3');
      h3.textContent = productName.textContent.trim();
      textFrag.appendChild(h3);
    }
    const desc = product.querySelector('p');
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      textFrag.appendChild(p);
    }
    const href = product.getAttribute('href');
    if (href) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = productName ? productName.textContent.trim() : 'Learn more';
      p.appendChild(a);
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (product)', cells });
  element.replaceWith(block);
}

function parseColumnsAnnouncement(element, { document }) {
  const columns = element.querySelectorAll('[class*="columnar-container-1-of-2"]');
  if (columns.length < 2) return;

  const textCol = columns[0];
  const textFrag = document.createDocumentFragment();

  const h2 = textCol.querySelector('h2');
  if (h2) {
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim();
    textFrag.appendChild(heading);
  }

  const paragraph = textCol.querySelector('p');
  if (paragraph) {
    const p = document.createElement('p');
    const link = paragraph.querySelector('a');
    if (link) {
      const fullText = paragraph.textContent.trim();
      const linkText = link.textContent.trim();
      const beforeLink = fullText.substring(0, fullText.indexOf(linkText)).trim();
      if (beforeLink) {
        p.appendChild(document.createTextNode(beforeLink + ' '));
      }
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href') || '');
      a.textContent = linkText;
      p.appendChild(a);
    } else {
      p.textContent = paragraph.textContent.trim();
    }
    textFrag.appendChild(p);
  }

  const imageCol = columns[1];
  const imageFrag = document.createDocumentFragment();
  const img = imageCol.querySelector('.responsiveImageDesktop img') || imageCol.querySelector('img');
  if (img) {
    const newImg = document.createElement('img');
    newImg.setAttribute('src', img.getAttribute('src') || '');
    newImg.setAttribute('alt', img.getAttribute('alt') || '');
    imageFrag.appendChild(newImg);
  }

  const cells = [[textFrag, imageFrag]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (announcement)', cells });
  element.replaceWith(block);
}

function parseCardsLink(element, { document }) {
  const cards = element.querySelectorAll('.squiggleButton');
  if (!cards.length) return;

  const cells = [];
  cards.forEach((card) => {
    const cellFrag = document.createDocumentFragment();
    const link = card.querySelector('a');
    const href = link ? link.getAttribute('href') : '';
    const header = card.querySelector('.squiggleHeader');
    const body = card.querySelector('.body');

    if (header) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = header.textContent.trim();
        h3.appendChild(a);
      } else {
        h3.textContent = header.textContent.trim();
      }
      cellFrag.appendChild(h3);
    }
    if (body) {
      const p = document.createElement('p');
      p.textContent = body.textContent.trim();
      cellFrag.appendChild(p);
    }
    cells.push(['', cellFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (link)', cells });
  element.replaceWith(block);
}

function parseColumnsFeature(element, { document }) {
  const columns = element.querySelectorAll('[class*="columnar-container-1-of-2"]');
  if (columns.length < 2) return;

  const colFrags = [];
  columns.forEach((col) => {
    const hasImage = col.querySelector('.responsiveImageContainer img, .responsiveImageDesktop img');
    const hasText = col.querySelector('.paragraph h2, .paragraph ul, .paragraph p');
    const hasCTA = col.querySelector('.buttonGroup a, .btn_container a, .imageButton a');

    const frag = document.createDocumentFragment();

    if (hasText) {
      const h2 = col.querySelector('h2');
      if (h2) {
        const heading = document.createElement('h2');
        heading.textContent = h2.textContent.trim();
        frag.appendChild(heading);
      }
      const ul = col.querySelector('ul');
      if (ul) {
        const newUl = document.createElement('ul');
        ul.querySelectorAll('li').forEach((li) => {
          const newLi = document.createElement('li');
          newLi.textContent = li.textContent.trim();
          newUl.appendChild(newLi);
        });
        frag.appendChild(newUl);
      }
      const paragraphs = col.querySelectorAll('.paragraph p');
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (text && text !== '\u00a0') {
          const newP = document.createElement('p');
          const strong = p.querySelector('strong');
          if (strong) {
            const newStrong = document.createElement('strong');
            newStrong.textContent = strong.textContent.trim();
            newP.appendChild(newStrong);
          } else {
            newP.textContent = text;
          }
          frag.appendChild(newP);
        }
      });
      const ctaLinks = col.querySelectorAll('.buttonGroup a, .btn_container a, .imageButton a');
      ctaLinks.forEach((link) => {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href') || '');
        const linkImg = link.querySelector('img');
        if (linkImg) {
          const newImg = document.createElement('img');
          newImg.setAttribute('src', linkImg.getAttribute('src') || '');
          newImg.setAttribute('alt', linkImg.getAttribute('alt') || '');
          a.appendChild(newImg);
        } else {
          a.textContent = link.textContent.trim();
        }
        p.appendChild(a);
        frag.appendChild(p);
      });
    } else if (hasImage) {
      const img = col.querySelector('.responsiveImageDesktop img') || col.querySelector('img');
      if (img) {
        const newImg = document.createElement('img');
        newImg.setAttribute('src', img.getAttribute('src') || '');
        newImg.setAttribute('alt', img.getAttribute('alt') || '');
        frag.appendChild(newImg);
      }
    } else if (hasCTA) {
      const ctaLinks = col.querySelectorAll('.buttonGroup a, .btn_container a, .imageButton a');
      ctaLinks.forEach((link) => {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href') || '');
        const linkImg = link.querySelector('img');
        if (linkImg) {
          const newImg = document.createElement('img');
          newImg.setAttribute('src', linkImg.getAttribute('src') || '');
          newImg.setAttribute('alt', linkImg.getAttribute('alt') || '');
          a.appendChild(newImg);
        } else {
          a.textContent = link.textContent.trim();
        }
        p.appendChild(a);
        frag.appendChild(p);
      });
    }

    colFrags.push(frag);
  });

  const cells = [colFrags];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (feature)', cells });
  element.replaceWith(block);
}

function parseColumnsContact(element, { document }) {
  const columns = element.querySelectorAll('[class*="columnar-container-1-of-3"]');
  if (columns.length < 3) return;

  const colFrags = [];
  columns.forEach((col) => {
    const frag = document.createDocumentFragment();
    const ctaLink = col.querySelector('.buttonGroup a, .btn_container a');
    if (ctaLink) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', ctaLink.getAttribute('href') || '');
      a.textContent = ctaLink.textContent.trim();
      p.appendChild(a);
      frag.appendChild(p);
    }

    const paragraph = col.querySelector('.paragraph');
    if (paragraph && !ctaLink) {
      const phoneLink = paragraph.querySelector('a[href^="tel:"]');
      if (phoneLink) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', phoneLink.getAttribute('href') || '');
        a.textContent = phoneLink.textContent.trim();
        p.appendChild(a);
        frag.appendChild(p);
      }
      const pElements = paragraph.querySelectorAll('p');
      pElements.forEach((pEl) => {
        const text = pEl.textContent.trim();
        if (phoneLink && text === phoneLink.textContent.trim()) return;
        const clone = pEl.cloneNode(true);
        const cloneLink = clone.querySelector('a');
        if (cloneLink) cloneLink.remove();
        const remainingText = clone.textContent.trim();
        if (remainingText) {
          const newP = document.createElement('p');
          newP.textContent = remainingText;
          frag.appendChild(newP);
        } else if (!phoneLink && text) {
          const newP = document.createElement('p');
          newP.textContent = text;
          frag.appendChild(newP);
        }
      });
    }

    colFrags.push(frag);
  });

  const cells = [colFrags];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (contact)', cells });
  element.replaceWith(block);
}

function parseCardsArticle(element, { document }) {
  const cards = element.querySelectorAll('.articleCard');
  if (!cards.length) return;

  const cells = [];
  cards.forEach((card) => {
    const imageFrag = document.createDocumentFragment();
    const img = card.querySelector('img.articleImg, img');
    if (img) {
      const newImg = document.createElement('img');
      newImg.setAttribute('src', img.getAttribute('src') || '');
      newImg.setAttribute('alt', img.getAttribute('alt') || '');
      imageFrag.appendChild(newImg);
    }

    const textFrag = document.createDocumentFragment();
    const heading = card.querySelector('.article-meat h3');
    const link = heading ? heading.querySelector('a') : null;
    if (heading && link) {
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href') || '');
      a.textContent = link.textContent.trim();
      h3.appendChild(a);
      textFrag.appendChild(h3);
    } else if (heading) {
      const h3 = document.createElement('h3');
      h3.textContent = heading.textContent.trim();
      textFrag.appendChild(h3);
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (article)', cells });
  element.replaceWith(block);
}

// ---------------------------------------------------------------------------
// Main transformer
// ---------------------------------------------------------------------------

/**
 * Map of block name to the parser function and the CSS selector used to
 * locate the block element within its parent section.
 */
const BLOCK_PARSERS = {
  'hero-banner': {
    parse: parseHeroBanner,
    instanceSelector: '.homepageHero',
  },
  'cards-product': {
    parse: parseCardsProduct,
    instanceSelector: '.visual-product-list',
  },
  'columns-announcement': {
    parse: parseColumnsAnnouncement,
    instanceSelector: '.columnarContainer',
  },
  'cards-link': {
    parse: parseCardsLink,
    instanceSelector: '.columnarContainer',
  },
  'columns-feature': {
    parse: parseColumnsFeature,
    instanceSelector: '.columnarContainer',
  },
  'columns-contact': {
    parse: parseColumnsContact,
    instanceSelector: '.columnarContainer',
  },
  'cards-article': {
    parse: parseCardsArticle,
    instanceSelector: '.columnarContainer',
  },
};

/**
 * Main transformer entry point.
 *
 * @param {string}  hookName - The lifecycle hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element  - The main content element to transform
 * @param {Object}  payload  - Context object containing { document, url, params }
 * @returns {Element} The transformed element
 */
export default function transform(hookName, element, payload) {
  const { document, url } = payload;

  if (hookName === 'beforeTransform') {
    // Pre-processing: clean up elements that should not be imported
    const removeSelectors = [
      'header',
      'nav',
      'footer',
      '.globalNav',
      '.globalFooter',
      '#signInModal',
      '.modal',
      '.overlay',
      '.signInBox-container',
    ];
    removeSelectors.forEach((sel) => {
      const els = document.querySelectorAll(sel);
      els.forEach((el) => el.remove());
    });
  }

  if (hookName === 'afterTransform') {
    // Post-processing: build the final page structure with sections,
    // block tables, section breaks, and metadata.
    const results = [];

    SECTIONS.forEach((section, index) => {
      const sectionEl = document.querySelector(section.selector);
      if (!sectionEl) return;

      // Section break between sections (not before the first)
      if (index > 0) {
        results.push(createSectionBreak(document));
      }

      // Default content (headings, paragraphs) that come before blocks
      if (section.defaultContent.length > 0) {
        section.defaultContent.forEach((sel) => {
          const els = sectionEl.querySelectorAll(sel);
          if (els && els.length > 0) {
            els.forEach((el) => {
              const clone = el.cloneNode(true);
              results.push(clone);
            });
          }
        });
      }

      // Block parsers
      section.blocks.forEach((blockName) => {
        const config = BLOCK_PARSERS[blockName];
        if (!config) return;

        // Locate the block element within the section
        let blockEl;
        if (section.id === 'section-1') {
          blockEl = sectionEl;
        } else {
          blockEl = sectionEl.querySelector(config.instanceSelector);
        }
        if (!blockEl) return;

        // Parsers call element.replaceWith(block) internally.
        // Wrap in a temporary div to capture the replacement.
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-importer-wrapper', 'true');
        const blockClone = blockEl.cloneNode(true);
        wrapper.appendChild(blockClone);
        document.body.appendChild(wrapper);

        config.parse(blockClone, { document });

        const generatedBlock = wrapper.firstElementChild;
        if (generatedBlock) {
          results.push(generatedBlock);
        }

        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      });

      // Section metadata block (if this section has a style)
      if (section.style) {
        results.push(createSectionMetadata(document, section.style));
      }
    });

    // Page metadata block at the end
    const pageMeta = extractPageMetadata(document);
    if (Object.keys(pageMeta).length > 0) {
      results.push(createSectionBreak(document));
      results.push(createMetadata(document, pageMeta));
    }

    // Replace the element content with our results
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    results.forEach((node) => {
      element.appendChild(node);
    });
  }

  return element;
}
