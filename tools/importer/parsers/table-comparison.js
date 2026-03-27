/**
 * table-comparison block parser
 *
 * Extracts the product comparison table from the personal checking page.
 * Source selector: .show-desktop .table-component table (desktop version only)
 * Fallback: #padded-container1 .updatedTableStyle table
 *
 * The source HTML contains a full <table> with <thead> and <tbody>.
 * This parser mirrors that structure into an EDS block table:
 *   - Header row with block name "Table (comparison)"
 *   - Second row mirrors the <thead> column headers
 *   - Subsequent rows mirror each <tbody> <tr>
 *
 * Only the desktop table is processed; the mobile table is skipped.
 */
export default function parse(document, url) {
  // Target the desktop table only; skip the mobile version
  let sourceTable = document.querySelector('.show-desktop .table-component table');
  if (!sourceTable) {
    sourceTable = document.querySelector('#padded-container1 .updatedTableStyle table');
  }
  if (!sourceTable) {
    sourceTable = document.querySelector('#CompBox table');
  }
  if (!sourceTable) return null;

  const thead = sourceTable.querySelector('thead');
  const tbody = sourceTable.querySelector('tbody');
  if (!thead && !tbody) return null;

  // Build the EDS block table
  const table = document.createElement('table');

  // --- Block name header row ---
  const blockNameRow = document.createElement('tr');
  const blockNameCell = document.createElement('th');
  // Determine column count from thead
  const headerCells = thead ? thead.querySelectorAll('th') : [];
  const colCount = headerCells.length || 4;
  blockNameCell.colSpan = colCount;
  blockNameCell.textContent = 'Table (comparison)';
  blockNameRow.appendChild(blockNameCell);
  table.appendChild(blockNameRow);

  // --- thead: column headers ---
  if (thead) {
    const headRows = thead.querySelectorAll('tr');
    headRows.forEach((srcRow) => {
      const row = document.createElement('tr');
      const cells = srcRow.querySelectorAll('th, td');
      cells.forEach((srcCell) => {
        const th = document.createElement('th');
        th.innerHTML = getCellContent(srcCell);
        row.appendChild(th);
      });
      table.appendChild(row);
    });
  }

  // --- tbody: data rows ---
  if (tbody) {
    const bodyRows = tbody.querySelectorAll('tr');
    bodyRows.forEach((srcRow) => {
      const row = document.createElement('tr');
      const cells = srcRow.querySelectorAll('th, td');
      cells.forEach((srcCell) => {
        const isHeader = srcCell.tagName === 'TH';
        const cell = document.createElement(isHeader ? 'th' : 'td');
        cell.innerHTML = getCellContent(srcCell);
        row.appendChild(cell);
      });
      table.appendChild(row);
    });
  }

  return table;
}

/**
 * Extract meaningful content from a table cell.
 * Preserves links, lists, and text. Converts icon-font checkmark cells
 * to a plain checkmark character. Trims non-breaking spaces.
 */
function getCellContent(cell) {
  // Checkmark cells use CSS icon font class "ab-icon-symbol"
  if (cell.classList && cell.classList.contains('ab-icon-symbol')) {
    return '\u2713';
  }

  // If the cell has child elements, extract structured HTML
  const children = cell.children;
  if (children && children.length > 0) {
    const parts = [];
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      if (child.tagName === 'UL' || child.tagName === 'OL') {
        parts.push(child.outerHTML);
      } else if (child.tagName === 'A') {
        parts.push(child.outerHTML);
      } else if (child.tagName === 'P') {
        // Preserve inner HTML of paragraphs (may contain links)
        parts.push(child.innerHTML.trim());
      } else {
        const text = child.textContent.trim();
        if (text) parts.push(text);
      }
    }
    const result = parts.join('');
    return cleanNbsp(result);
  }

  // Plain text cell
  return cleanNbsp(cell.textContent.trim());
}

/**
 * Replace non-breaking spaces with regular spaces and trim.
 */
function cleanNbsp(str) {
  return str.replace(/\u00a0/g, ' ').trim();
}
