/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import homepageTransformer from './transformers/homepage.js';

// TRANSFORMER REGISTRY
const transformers = [homepageTransformer];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Full-width marketing homepage with hero, product category cards, alternating content+image promos, and educational articles',
  urls: [
    'http://localhost:8765/homepage-backup/cleaned.html'
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: '.homepageHero',
      style: null,
      blocks: ['hero-banner'],
      defaultContent: []
    },
    {
      id: 'section-2',
      name: 'Product Categories',
      selector: '#Newvisual_products',
      style: null,
      blocks: ['cards-product'],
      defaultContent: ['#Newvisual_products h2']
    },
    {
      id: 'section-3',
      name: 'Merger Announcement',
      selector: '#padded-container0',
      style: 'navy-blue',
      blocks: ['columns-announcement'],
      defaultContent: []
    },
    {
      id: 'section-4',
      name: 'Business/Wealth/Commercial',
      selector: '#padded-container1',
      style: 'dark',
      blocks: ['cards-link'],
      defaultContent: ['#padded-container1 h2']
    },
    {
      id: 'section-5',
      name: 'Home Loans Feature',
      selector: '#padded-container2',
      style: null,
      blocks: ['columns-feature'],
      defaultContent: []
    },
    {
      id: 'section-6',
      name: 'Checking Feature',
      selector: '#padded-container3',
      style: 'teal',
      blocks: ['columns-feature'],
      defaultContent: []
    },
    {
      id: 'section-7',
      name: 'Credit Cards Feature',
      selector: '#padded-container4',
      style: null,
      blocks: ['columns-feature'],
      defaultContent: []
    },
    {
      id: 'section-8',
      name: 'Digital Banking / Mobile App',
      selector: '#padded-container5',
      style: null,
      blocks: ['columns-feature'],
      defaultContent: []
    },
    {
      id: 'section-9',
      name: 'Customer Care',
      selector: '#padded-container6',
      style: 'green',
      blocks: ['columns-contact'],
      defaultContent: ['#padded-container6 h2']
    },
    {
      id: 'section-10',
      name: 'Educational Articles',
      selector: '#padded-container7',
      style: null,
      blocks: ['cards-article'],
      defaultContent: ['#padded-container7 h2']
    },
    {
      id: 'section-11',
      name: 'Disclosures',
      selector: '#disclosures',
      style: null,
      blocks: [],
      defaultContent: ['#disclosures ol', '#disclosures ul']
    }
  ],
  blocks: [
    {
      name: 'hero-banner',
      instances: ['.homepageHero']
    },
    {
      name: 'cards-product',
      instances: ['#Newvisual_products .visual-product-list']
    },
    {
      name: 'columns-announcement',
      instances: ['#padded-container0 .columnarContainer']
    },
    {
      name: 'cards-link',
      instances: ['#padded-container1 .columnarContainer']
    },
    {
      name: 'columns-feature',
      instances: [
        '#padded-container2 .columnarContainer',
        '#padded-container3 .columnarContainer',
        '#padded-container4 .columnarContainer',
        '#padded-container5 .columnarContainer'
      ]
    },
    {
      name: 'columns-contact',
      instances: ['#padded-container6 .columnarContainer']
    },
    {
      name: 'cards-article',
      instances: ['#padded-container7 .columnarContainer']
    }
  ]
};

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

// EXPORT DEFAULT CONFIGURATION
export default {
  /**
   * Main transformation function using the Helix Importer transform() pattern.
   * The homepage transformer handles all section orchestration, block parsing,
   * section breaks, and section metadata internally via beforeTransform/afterTransform hooks.
   */
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial DOM cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Execute afterTransform transformers (section orchestration + block parsing)
    //    The homepage transformer handles block discovery, parsing, section breaks,
    //    section metadata, and page metadata all in its afterTransform hook.
    executeTransformers('afterTransform', main, payload);

    // 3. Apply WebImporter built-in rules
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 4. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname
        .replace(/\/$/, '')
        .replace(/\.html$/, '')
    ) || '/index';

    return [{
      element: main,
      path,
      report: {
        title: document.title || 'Homepage',
        template: PAGE_TEMPLATE.name,
        blocks: PAGE_TEMPLATE.blocks.map(b => b.name),
      }
    }];
  }
};
