/* eslint-disable */
/* global WebImporter */

/**
 * Shared utility functions for Associated Bank AEM EDS import scripts.
 *
 * These helpers produce the DOM elements that the AEM importer
 * serialises into Markdown block tables, section breaks, and metadata.
 */

/**
 * Create an EDS block table element.
 *
 * @param {Document} document - DOM document reference
 * @param {string}   name    - Block name shown in the header cell (e.g. "Cards (product)")
 * @param {Array<Array>} rows - Array of rows, each row is an array of cell contents
 *                               (strings or DOM Element/DocumentFragment instances)
 * @returns {HTMLTableElement}
 */
export function createBlock(document, name, rows) {
  const table = document.createElement('table');

  // Header row with the block name
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.textContent = name;
  headerCell.colSpan = (rows.length > 0 && rows[0].length) || 1;
  headerRow.append(headerCell);
  table.append(headerRow);

  // Data rows
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

/**
 * Create a thematic-break element that the AEM importer converts to "---"
 * in the Markdown output, marking a section boundary.
 *
 * @param {Document} document
 * @returns {HTMLHRElement}
 */
export function createSectionBreak(document) {
  return document.createElement('hr');
}

/**
 * Create a Section Metadata block table.
 *
 * In the output Markdown this becomes:
 *
 * | Section Metadata |       |
 * | ---------------- | ----- |
 * | style            | <val> |
 *
 * @param {Document} document
 * @param {string}   style - The style value (e.g. "navy-blue", "dark", "teal", "green")
 * @returns {HTMLTableElement}
 */
export function createSectionMetadata(document, style) {
  return createBlock(document, 'Section Metadata', [['style', style]]);
}

/**
 * Create the page-level Metadata block table appended at the very end of the
 * import output.
 *
 * @param {Document} document
 * @param {Object}   metadata - key/value pairs (e.g. { Title: '...', Description: '...', 'og:image': '...' })
 * @returns {HTMLTableElement}
 */
export function createMetadata(document, metadata) {
  const rows = Object.entries(metadata).map(([key, value]) => {
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
      // If the value looks like a URL (e.g. og:image), wrap it in an <img> or <a>
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

/**
 * Extract common page metadata from <head> meta tags.
 *
 * @param {Document} document
 * @returns {Object} metadata key/value pairs
 */
export function extractPageMetadata(document) {
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

/**
 * Extract default content elements (headings, paragraphs, lists) from a
 * section container and return them as clean DOM nodes suitable for
 * appending to the import results array.
 *
 * @param {Document} document
 * @param {Element}  sectionEl - The section container element
 * @param {string[]} selectors - CSS selectors for default content within the section
 * @returns {Element[]} array of cloned/cleaned elements
 */
export function extractDefaultContent(document, sectionEl, selectors) {
  const elements = [];
  selectors.forEach((selector) => {
    // Selectors may be absolute (starting from root) or relative to sectionEl
    const matches = sectionEl.querySelectorAll(selector.replace(/^[^.#\[]*\s/, ''))
      || document.querySelectorAll(selector);

    if (matches) {
      matches.forEach((el) => {
        const clone = el.cloneNode(true);
        elements.push(clone);
      });
    }
  });
  return elements;
}
