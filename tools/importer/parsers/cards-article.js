/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-article block.
 * Source: https://www.associatedbank.com/
 * Selector: #padded-container7 .columnarContainer
 * Model: 4 article cards, each with thumbnail image and heading link.
 * Structure: N rows, 2 columns each [image | heading link]
 */
export default function parse(element, { document }) {
  const cards = element.querySelectorAll('.articleCard');
  if (!cards.length) return;

  const cells = [];

  cards.forEach((card) => {
    // Column 1: thumbnail image
    const imageFrag = document.createDocumentFragment();
    const img = card.querySelector('img.articleImg, img');
    if (img) {
      const newImg = document.createElement('img');
      newImg.setAttribute('src', img.getAttribute('src') || '');
      newImg.setAttribute('alt', img.getAttribute('alt') || '');
      imageFrag.appendChild(newImg);
    }

    // Column 2: heading as link
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
