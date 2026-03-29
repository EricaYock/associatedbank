/**
 * cards-pricing block parser
 *
 * Extracts product pricing cards from the personal checking page.
 * Source selector: #padded-container0 .columnarContainer
 *
 * Each card contains:
 *  - .title-block: category label (p) + product name (h2)
 *  - .product-checklist: benefits list, fee details
 *  - CTA button (anchor with .primary-button)
 *
 * Returns an EDS block table with one row per card, single column each:
 *   [label, heading, benefits list, fee text, CTA link]
 */
export default function parse(document, url) {
  const container = document.querySelector('#padded-container0 .columnarContainer');
  if (!container) return null;

  const cards = container.querySelectorAll('.product-tile-block');
  if (!cards || cards.length === 0) return null;

  // Build the EDS block table
  const table = document.createElement('table');

  // Header row with block name
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.colSpan = 2;
  headerCell.textContent = 'Cards (pricing)';
  headerRow.appendChild(headerCell);
  table.appendChild(headerRow);

  cards.forEach((card) => {
    const row = document.createElement('tr');

    // Empty image column (card model requires 2 columns: image + text)
    const emptyCell = document.createElement('td');
    row.appendChild(emptyCell);

    const cell = document.createElement('td');

    // 1. Category label from .title-block p
    const titleBlock = card.querySelector('.title-block');
    if (titleBlock) {
      const labelP = titleBlock.querySelector('p');
      if (labelP) {
        const p = document.createElement('p');
        p.textContent = labelP.textContent.trim();
        cell.appendChild(p);
      }

      // 2. Product name heading from .title-block h2
      const heading = titleBlock.querySelector('h2');
      if (heading) {
        const h2 = document.createElement('h2');
        h2.textContent = heading.textContent.trim();
        cell.appendChild(h2);
      }
    }

    // 3. Benefits list and fee details from .product-checklist
    const checklists = card.querySelectorAll('.product-checklist');
    if (checklists && checklists.length > 0) {
      // First checklist: benefits paragraph + list + fee text
      const benefitChecklist = checklists[0];

      // Benefits strong label (e.g., "Benefits")
      const benefitLabel = benefitChecklist.querySelector('p strong');
      if (benefitLabel) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = benefitLabel.textContent.trim();
        p.appendChild(strong);
        cell.appendChild(p);
      }

      // Benefits unordered list
      const benefitList = benefitChecklist.querySelector('ul');
      if (benefitList) {
        const ul = document.createElement('ul');
        const items = benefitList.querySelectorAll('li');
        items.forEach((item) => {
          const li = document.createElement('li');
          li.textContent = item.textContent.trim();
          ul.appendChild(li);
        });
        cell.appendChild(ul);
      }

      // Fee details paragraph (after the <hr>)
      // This is typically the last <p> inside the paragraph div within the checklist
      const paragraphs = benefitChecklist.querySelectorAll('.paragraph p');
      if (paragraphs && paragraphs.length > 0) {
        // The fee paragraph is the last one (after <hr>), skip the "Benefits" label paragraph
        const feeParagraphs = Array.from(paragraphs).filter(
          (p) => !p.querySelector('strong') || p.querySelector('a'),
        );
        feeParagraphs.forEach((feeP) => {
          // Skip the "Benefits" label
          if (feeP.querySelector('strong') && !feeP.querySelector('a')) return;
          const p = document.createElement('p');
          // Preserve text and links
          feeP.childNodes.forEach((node) => {
            if (node.nodeType === 3) {
              // text node
              p.appendChild(document.createTextNode(node.textContent));
            } else if (node.nodeName === 'A') {
              const a = document.createElement('a');
              a.href = node.href || node.getAttribute('href') || '';
              a.textContent = node.textContent.trim();
              p.appendChild(a);
            } else {
              p.appendChild(document.createTextNode(node.textContent));
            }
          });
          cell.appendChild(p);
        });
      }

      // 4. CTA button from second .product-checklist or from the card
      let ctaAnchor = null;
      if (checklists.length > 1) {
        ctaAnchor = checklists[1].querySelector('a.primary-button');
      }
      if (!ctaAnchor) {
        ctaAnchor = card.querySelector('a.primary-button');
      }
      if (ctaAnchor) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = ctaAnchor.href || ctaAnchor.getAttribute('href') || '';
        // Extract the button text from nested spans
        const spanText = ctaAnchor.querySelector('span span');
        a.textContent = spanText
          ? spanText.textContent.trim()
          : ctaAnchor.textContent.trim();
        p.appendChild(a);
        cell.appendChild(p);
      }
    }

    row.appendChild(cell);
    table.appendChild(row);
  });

  return table;
}
