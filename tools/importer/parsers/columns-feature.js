/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-feature block.
 * Source: https://www.associatedbank.com/
 * Selectors: #padded-container2 through #padded-container5 .columnarContainer
 * Model: 1 row, 2 columns [text+CTA | image] or [image | text+CTA]
 * Preserves the DOM column order for each instance.
 */
export default function parse(element, { document }) {
  const columns = element.querySelectorAll('[class*="columnar-container-1-of-2"]');
  if (columns.length < 2) return;

  // Determine which column is text and which is image by checking for paragraph/heading content
  const colFrags = [];

  columns.forEach((col) => {
    const hasImage = col.querySelector('.responsiveImageContainer img, .responsiveImageDesktop img');
    const hasText = col.querySelector('.paragraph h2, .paragraph ul, .paragraph p');
    const hasCTA = col.querySelector('.buttonGroup a, .btn_container a, .imageButton a');

    const frag = document.createDocumentFragment();

    if (hasText) {
      // Text column: extract heading, list, extra text, and CTA
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

      // Extract additional paragraph content (e.g., star rating text in digital banking)
      const paragraphs = col.querySelectorAll('.paragraph p');
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (text && text !== '\u00a0') {
          const newP = document.createElement('p');
          // Check for bold/strong text
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

      // Extract CTA buttons/links
      const ctaLinks = col.querySelectorAll('.buttonGroup a, .btn_container a, .imageButton a');
      ctaLinks.forEach((link) => {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href') || '');
        // Check if the link contains an image (e.g., app store badges)
        const linkImg = link.querySelector('img');
        if (linkImg) {
          const img = document.createElement('img');
          img.setAttribute('src', linkImg.getAttribute('src') || '');
          img.setAttribute('alt', linkImg.getAttribute('alt') || '');
          a.appendChild(img);
        } else {
          a.textContent = link.textContent.trim();
        }
        p.appendChild(a);
        frag.appendChild(p);
      });
    } else if (hasImage) {
      // Image column: extract the desktop image
      const img = col.querySelector('.responsiveImageDesktop img') || col.querySelector('img');
      if (img) {
        const newImg = document.createElement('img');
        newImg.setAttribute('src', img.getAttribute('src') || '');
        newImg.setAttribute('alt', img.getAttribute('alt') || '');
        frag.appendChild(newImg);
      }
    } else if (hasCTA) {
      // CTA-only column (app store badges, etc.)
      const ctaLinks = col.querySelectorAll('.buttonGroup a, .btn_container a, .imageButton a');
      ctaLinks.forEach((link) => {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href') || '');
        const linkImg = link.querySelector('img');
        if (linkImg) {
          const img = document.createElement('img');
          img.setAttribute('src', linkImg.getAttribute('src') || '');
          img.setAttribute('alt', linkImg.getAttribute('alt') || '');
          a.appendChild(img);
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
