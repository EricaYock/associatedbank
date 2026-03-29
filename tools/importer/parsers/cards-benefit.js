/**
 * cards-benefit block parser
 *
 * Extracts the benefit grid items from the personal checking page.
 * Source selector: .timelineContainer .timelineBlips .blip
 *
 * Each benefit item is an anchor (<a class="imageLink">) containing:
 *  - A div with a CSS-based circle icon (blipImage) -- no <img> tag
 *  - A <p class="heading"> with the bold title
 *  - A <p class="subHeading"> with the description
 *
 * Returns an EDS block table with one row per benefit item:
 *   - If real images exist: 2 columns [icon image | heading + description]
 *   - If icons are CSS-based circles (no <img>): 1 column [heading + description as link]
 */
export default function parse(document, url) {
  const blips = document.querySelectorAll('.timelineContainer .timelineBlips .blip');
  if (!blips || blips.length === 0) return null;

  // Determine if icons are real images or CSS-based
  const firstBlip = blips[0];
  const firstImg = firstBlip.querySelector('.blipImage img');
  const hasRealImages = !!firstImg;

  const colCount = 2; // card model always requires 2 columns (image + text)

  // Build the EDS block table
  const table = document.createElement('table');

  // Header row with block name
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.colSpan = colCount;
  headerCell.textContent = 'Cards (benefit)';
  headerRow.appendChild(headerCell);
  table.appendChild(headerRow);

  blips.forEach((blip) => {
    const row = document.createElement('tr');
    const anchor = blip.querySelector('a.imageLink');
    const linkHref = anchor ? (anchor.getAttribute('href') || '') : '';

    // Column 1: image (empty if CSS-based icons)
    const imgCell = document.createElement('td');
    if (hasRealImages) {
      const img = blip.querySelector('.blipImage img');
      if (img) {
        const newImg = document.createElement('img');
        newImg.src = img.getAttribute('src') || img.src || '';
        newImg.alt = img.getAttribute('alt') || '';
        imgCell.appendChild(newImg);
      }
    }
    row.appendChild(imgCell);

    // Column 2: heading + description, wrapped in a link
    const contentCell = document.createElement('td');

    const headingEl = blip.querySelector('p.heading');
    const subHeadingEl = blip.querySelector('p.subHeading');

    // Create heading as a strong paragraph
    if (headingEl) {
      const p = document.createElement('p');
      if (linkHref) {
        const a = document.createElement('a');
        a.setAttribute('href', linkHref);
        const strong = document.createElement('strong');
        strong.textContent = headingEl.textContent.trim();
        a.appendChild(strong);
        p.appendChild(a);
      } else {
        const strong = document.createElement('strong');
        strong.textContent = headingEl.textContent.trim();
        p.appendChild(strong);
      }
      contentCell.appendChild(p);
    }

    // Create description paragraph
    if (subHeadingEl) {
      const p = document.createElement('p');
      p.textContent = subHeadingEl.textContent.trim();
      contentCell.appendChild(p);
    }

    row.appendChild(contentCell);
    table.appendChild(row);
  });

  return table;
}
