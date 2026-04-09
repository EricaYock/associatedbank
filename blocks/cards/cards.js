import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  /* Pricing variant: mark tagline paragraph with a class */
  if (block.classList.contains('pricing')) {
    ul.querySelectorAll('.cards-card-body h3').forEach((h3) => {
      const prev = h3.previousElementSibling;
      if (prev && prev.tagName === 'P' && !prev.querySelector('strong')) {
        prev.classList.add('cards-pricing-tagline');
      }
    });
  }

  block.textContent = '';
  block.append(ul);
}
