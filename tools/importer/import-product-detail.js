/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import productDetailTransformer from './transformers/product-detail.js';

// TRANSFORMER REGISTRY
const transformers = [productDetailTransformer];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'product-detail',
  description: 'Product detail page with hero, intro, product comparison cards, feature comparison table, benefits grid, and digital banking features',
  urls: [
    'http://localhost:8765/cleaned.html'
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: '.hero-image',
      style: null,
      blocks: ['hero-banner'],
      defaultContent: []
    },
    {
      id: 'section-2',
      name: 'Intro',
      selector: '.intro-section-container',
      style: 'teal',
      blocks: ['columns-feature'],
      defaultContent: []
    },
    {
      id: 'section-3',
      name: 'Product Cards',
      selector: '#padded-container0',
      style: null,
      blocks: ['cards-pricing'],
      defaultContent: ['#padded-container0 h2:first-of-type', '#padded-container0 > .limit-max-width-homepage > .paragraph:last-child']
    },
    {
      id: 'section-4',
      name: 'Comparison Table',
      selector: '#CompBox',
      style: 'green',
      blocks: ['table-comparison'],
      defaultContent: []
    },
    {
      id: 'section-5',
      name: 'Find Your Fit CTA',
      selector: '#padded-container4',
      style: 'green',
      blocks: [],
      defaultContent: ['#padded-container4 h2', '#padded-container4 .buttonGroup']
    },
    {
      id: 'section-6',
      name: 'Benefits Grid',
      selector: '[id="8pack"]',
      style: null,
      blocks: ['cards-benefit'],
      defaultContent: ['[id="8pack"] h2']
    },
    {
      id: 'section-7',
      name: 'Digital Banking Feature',
      selector: '#padded-container6',
      style: 'teal',
      blocks: ['columns-feature'],
      defaultContent: ['#padded-container6 h2']
    },
    {
      id: 'section-8',
      name: 'In-Person CTA',
      selector: '#padded-container8',
      style: null,
      blocks: [],
      defaultContent: ['#padded-container8 h2', '#padded-container8 a']
    },
    {
      id: 'section-9',
      name: 'Contact Info',
      selector: '.left-panel-link-container',
      style: 'green',
      blocks: ['columns-contact'],
      defaultContent: []
    },
    {
      id: 'section-10',
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
      instances: ['.hero-image']
    },
    {
      name: 'columns-feature',
      instances: [
        '.intro-section-container .intro-section',
        '#padded-container6 .columnarContainer'
      ]
    },
    {
      name: 'cards-pricing',
      instances: ['#padded-container0 .columnarContainer']
    },
    {
      name: 'table-comparison',
      instances: ['#CompBox .table-component']
    },
    {
      name: 'cards-benefit',
      instances: ['[id="8pack"] .timelineBlips']
    },
    {
      name: 'columns-contact',
      instances: ['.left-panel-link-container']
    }
  ]
};

/**
 * Execute all page transformers for a specific hook
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
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform (initial DOM cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Execute afterTransform (section orchestration + block parsing)
    executeTransformers('afterTransform', main, payload);

    // 3. Apply WebImporter built-in rules
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 4. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname
        .replace(/\/$/, '')
        .replace(/\.html$/, '')
    ) || '/personal/personal-checking';

    return [{
      element: main,
      path,
      report: {
        title: document.title || 'Personal Checking Accounts',
        template: PAGE_TEMPLATE.name,
        blocks: PAGE_TEMPLATE.blocks.map(b => b.name),
      }
    }];
  }
};
