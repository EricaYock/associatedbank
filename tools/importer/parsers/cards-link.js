/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-link block.
 * Source: https://www.associatedbank.com/
 * Selector: #padded-container1 .columnarContainer
 * Model: 3 linked card items, each with header title, description body, and link.
 * Structure: N rows, 2 columns each [empty image | heading + paragraph as link]
 */
export default function parse(element, { document }) {
  const cards = element.querySelectorAll('.squiggleButton');
  if (!cards.length) return;

  const cells = [];

  cards.forEach((card) => {
    const cellFrag = document.createDocumentFragment();

    const link = card.querySelector('a');
    const href = link ? link.getAttribute('href') : '';

    const header = card.querySelector('.squiggleHeader');
    const body = card.querySelector('.body');

    // Create heading with link
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

    // Add description paragraph
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
