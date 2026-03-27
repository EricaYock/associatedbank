/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-announcement block.
 * Source: https://www.associatedbank.com/
 * Selector: #padded-container0 .columnarContainer
 * Model: 1 row, 2 columns [text (h2 + paragraph with link) | image (logo)]
 */
export default function parse(element, { document }) {
  const columns = element.querySelectorAll('[class*="columnar-container-1-of-2"]');
  if (columns.length < 2) return;

  // Column 1: text content (h2 heading + paragraph with link)
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
    // Rebuild paragraph content preserving the link
    const link = paragraph.querySelector('a');
    const textBefore = paragraph.textContent.trim();

    if (link) {
      // Get text before the link
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
      p.textContent = textBefore;
    }
    textFrag.appendChild(p);
  }

  // Column 2: image (logo lockup)
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
