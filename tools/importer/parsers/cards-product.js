/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-product block.
 * Source: https://www.associatedbank.com/
 * Selector: #Newvisual_products .visual-product-list
 * Model: 6 product cards, each with icon image, heading, and description paragraph.
 * Structure: N rows, 2 columns each [image | heading + paragraph]
 */
export default function parse(element, { document }) {
  const products = element.querySelectorAll('.visualProduct');
  if (!products.length) return;

  const cells = [];

  products.forEach((product) => {
    // Column 1: product icon image
    const imageFrag = document.createDocumentFragment();
    const img = product.querySelector('img.primary-icon');
    if (img) {
      const newImg = document.createElement('img');
      newImg.setAttribute('src', img.getAttribute('src') || '');
      newImg.setAttribute('alt', img.getAttribute('alt') || '');
      imageFrag.appendChild(newImg);
    }

    // Column 2: heading + description
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

    // Add link if the product is an anchor
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
