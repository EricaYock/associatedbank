/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner block.
 * Source: https://www.associatedbank.com/
 * Selector: .homepageHero
 * Model: Single row with heading, paragraph, and CTA link.
 */
export default function parse(element, { document }) {
  const content = element.querySelector('.desktopContent') || element;

  // Extract H1 heading
  const h1 = content.querySelector('h1');

  // Extract supporting text from .textContent div (text node after h1)
  const textContainer = content.querySelector('.textContent');
  let paragraphText = '';
  if (textContainer) {
    const clone = textContainer.cloneNode(true);
    const innerH1 = clone.querySelector('h1');
    if (innerH1) innerH1.remove();
    paragraphText = clone.textContent.trim();
  }

  // Extract CTA link
  const ctaLink = content.querySelector('.buttonContainer a');

  // Build cell content
  const cellFrag = document.createDocumentFragment();

  if (h1) {
    const heading = document.createElement('h1');
    heading.textContent = h1.textContent.trim();
    cellFrag.appendChild(heading);
  }

  if (paragraphText) {
    const p = document.createElement('p');
    p.textContent = paragraphText;
    cellFrag.appendChild(p);
  }

  if (ctaLink) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', ctaLink.getAttribute('href') || '');
    a.textContent = ctaLink.textContent.trim();
    p.appendChild(a);
    cellFrag.appendChild(p);
  }

  const cells = [[cellFrag]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero Banner', cells });
  element.replaceWith(block);
}
