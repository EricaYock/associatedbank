/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-contact block.
 * Source: https://www.associatedbank.com/
 * Selector: #padded-container6 .columnarContainer
 * Model: 1 row, 3 columns [schedule appointment CTA | find branch CTA | phone + hours]
 */
export default function parse(element, { document }) {
  const columns = element.querySelectorAll('[class*="columnar-container-1-of-3"]');
  if (columns.length < 3) return;

  const colFrags = [];

  columns.forEach((col, index) => {
    const frag = document.createDocumentFragment();

    // First two columns are CTA buttons
    const ctaLink = col.querySelector('.buttonGroup a, .btn_container a');
    if (ctaLink) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', ctaLink.getAttribute('href') || '');
      a.textContent = ctaLink.textContent.trim();
      p.appendChild(a);
      frag.appendChild(p);
    }

    // Third column is phone number + hours text
    const paragraph = col.querySelector('.paragraph');
    if (paragraph && !ctaLink) {
      // Extract phone link
      const phoneLink = paragraph.querySelector('a[href^="tel:"]');
      if (phoneLink) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', phoneLink.getAttribute('href') || '');
        a.textContent = phoneLink.textContent.trim();
        p.appendChild(a);
        frag.appendChild(p);
      }

      // Extract hours text from paragraph content
      const pElements = paragraph.querySelectorAll('p');
      pElements.forEach((pEl) => {
        const text = pEl.textContent.trim();
        // Skip if it only contains the phone number we already extracted
        if (phoneLink && text === phoneLink.textContent.trim()) return;

        // Get text after the phone number link
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
