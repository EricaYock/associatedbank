var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-product-detail.js
  var import_product_detail_exports = {};
  __export(import_product_detail_exports, {
    default: () => import_product_detail_default
  });

  // tools/importer/transformers/product-detail.js
  var SECTIONS = [
    {
      id: "section-1",
      name: "Hero",
      selector: ".hero-image",
      style: null,
      blocks: ["hero-banner"],
      defaultContent: []
    },
    {
      id: "section-2",
      name: "Intro",
      selector: ".intro-section-container",
      style: "teal",
      blocks: ["columns-feature"],
      defaultContent: []
    },
    {
      id: "section-3",
      name: "Product Cards",
      selector: "#padded-container0",
      style: null,
      blocks: ["cards-pricing"],
      defaultContent: []
    },
    {
      id: "section-4",
      name: "Comparison Table",
      selector: "#CompBox",
      style: "green",
      blocks: ["table-comparison"],
      defaultContent: []
    },
    {
      id: "section-5",
      name: "Find Your Fit CTA",
      selector: "#padded-container4",
      style: "green",
      blocks: [],
      defaultContent: []
    },
    {
      id: "section-6",
      name: "Benefits Grid",
      selector: '[id="8pack"]',
      style: null,
      blocks: ["cards-benefit"],
      defaultContent: []
    },
    {
      id: "section-7",
      name: "Digital Banking Feature",
      selector: "#padded-container6",
      style: "teal",
      blocks: ["columns-feature-digital"],
      defaultContent: []
    },
    {
      id: "section-8",
      name: "In-Person CTA",
      selector: "#padded-container8",
      style: null,
      blocks: [],
      defaultContent: []
    },
    {
      id: "section-9",
      name: "Contact Info",
      selector: ".left-panel-link-container",
      style: "green",
      blocks: ["columns-contact"],
      defaultContent: []
    },
    {
      id: "section-10",
      name: "Disclosures",
      selector: "#disclosures",
      style: null,
      blocks: [],
      defaultContent: []
    }
  ];
  function createBlock(document, name, rows) {
    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    const headerCell = document.createElement("th");
    headerCell.textContent = name;
    headerCell.colSpan = rows.length > 0 && rows[0].length || 1;
    headerRow.append(headerCell);
    table.append(headerRow);
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cellContent) => {
        const td = document.createElement("td");
        if (typeof cellContent === "string") {
          td.textContent = cellContent;
        } else if (cellContent instanceof Element || cellContent instanceof DocumentFragment) {
          td.append(cellContent);
        }
        tr.append(td);
      });
      table.append(tr);
    });
    return table;
  }
  function createSectionBreak(document) {
    return document.createElement("hr");
  }
  function createSectionMetadata(document, style) {
    return createBlock(document, "Section Metadata", [["style", style]]);
  }
  function createMetadata(document, metadata) {
    const rows = Object.entries(metadata).map(([key, value]) => {
      if (typeof value === "string" && (value.startsWith("http") || value.startsWith("/"))) {
        if (/\.(png|jpe?g|gif|svg|webp)(\?|$)/i.test(value)) {
          const img = document.createElement("img");
          img.setAttribute("src", value);
          return [key, img];
        }
        const a = document.createElement("a");
        a.setAttribute("href", value);
        a.textContent = value;
        return [key, a];
      }
      return [key, value];
    });
    return createBlock(document, "Metadata", rows);
  }
  function extractPageMetadata(document) {
    const meta = {};
    const title = document.querySelector("title");
    if (title) meta.Title = title.textContent.trim();
    const description = document.querySelector('meta[name="description"]') || document.querySelector('meta[property="og:description"]');
    if (description) meta.Description = description.getAttribute("content") || "";
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) meta["og:image"] = ogImage.getAttribute("content") || "";
    return meta;
  }
  function parseHeroBanner(element, { document }) {
    const h1 = element.querySelector("h1");
    const cellFrag = document.createDocumentFragment();
    if (h1) {
      const heading = document.createElement("h1");
      heading.textContent = h1.textContent.trim();
      cellFrag.appendChild(heading);
    }
    const cells = [["", "", cellFrag]];
    return createBlock(document, "Hero Banner", cells);
  }
  function parseColumnsFeatureIntro(element, { document }) {
    const introText = element.querySelector(".intro-bigger");
    const introImg = element.querySelector("img.hide-tablet") || element.querySelector("img.gray-frame");
    const textFrag = document.createDocumentFragment();
    if (introText) {
      const p = document.createElement("p");
      const spans = introText.querySelectorAll("span span");
      if (spans.length > 0) {
        p.textContent = spans[spans.length - 1].textContent.trim();
      } else {
        p.textContent = introText.textContent.trim();
      }
      textFrag.appendChild(p);
    }
    const imageFrag = document.createDocumentFragment();
    if (introImg) {
      const newImg = document.createElement("img");
      newImg.setAttribute("src", introImg.getAttribute("src") || "");
      newImg.setAttribute("alt", introImg.getAttribute("alt") || "");
      imageFrag.appendChild(newImg);
    }
    return createBlock(document, "Columns (feature)", [[imageFrag, textFrag]]);
  }
  function parseCardsPricing(sectionEl, { document }) {
    const results = [];
    const h2 = sectionEl.querySelector("#paragraph_0 h2, .paragraph h2");
    if (h2) {
      const heading = document.createElement("h2");
      heading.textContent = h2.textContent.trim();
      results.push(heading);
    }
    const cards = sectionEl.querySelectorAll(".product-tile-block");
    if (cards.length > 0) {
      const cells = [];
      cards.forEach((card) => {
        const cellFrag = document.createDocumentFragment();
        const label = card.querySelector(".title-block p");
        if (label) {
          const p = document.createElement("p");
          p.textContent = label.textContent.trim();
          cellFrag.appendChild(p);
        }
        const cardH2 = card.querySelector(".title-block h2");
        if (cardH2) {
          const heading = document.createElement("h3");
          heading.textContent = cardH2.textContent.trim();
          cellFrag.appendChild(heading);
        }
        const benefitsP = card.querySelector(".product-checklist .paragraph p strong");
        if (benefitsP) {
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = "Benefits";
          p.appendChild(strong);
          cellFrag.appendChild(p);
        }
        const ul = card.querySelector(".product-checklist ul");
        if (ul) {
          const newUl = document.createElement("ul");
          ul.querySelectorAll("li").forEach((li) => {
            const newLi = document.createElement("li");
            newLi.textContent = li.textContent.trim();
            newUl.appendChild(newLi);
          });
          cellFrag.appendChild(newUl);
        }
        const feeP = card.querySelector(".product-checklist .paragraph hr + p");
        if (feeP) {
          const p = document.createElement("p");
          p.textContent = feeP.textContent.trim();
          cellFrag.appendChild(p);
        }
        const cta = card.querySelector(".product-checklist a.primary-button");
        if (cta) {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.setAttribute("href", cta.getAttribute("href") || "");
          a.textContent = cta.textContent.trim();
          p.appendChild(a);
          cellFrag.appendChild(p);
        }
        cells.push(["", cellFrag]);
      });
      results.push(createBlock(document, "Cards (pricing)", cells));
    }
    const upsellP = sectionEl.querySelector("#paragraph_4 p");
    if (upsellP) {
      const p = document.createElement("p");
      const link = upsellP.querySelector("a");
      if (link) {
        const textBefore = upsellP.childNodes[0]?.textContent?.trim() || "";
        if (textBefore) p.appendChild(document.createTextNode(textBefore + " "));
        const a = document.createElement("a");
        a.setAttribute("href", link.getAttribute("href") || "");
        a.textContent = link.textContent.trim();
        p.appendChild(a);
        const textAfter = upsellP.lastChild?.textContent?.trim() || "";
        if (textAfter && textAfter !== link.textContent.trim()) {
          p.appendChild(document.createTextNode(" " + textAfter));
        }
      } else {
        p.textContent = upsellP.textContent.trim();
      }
      results.push(p);
    }
    return results;
  }
  function parseTableComparison(sectionEl, { document }) {
    const table = sectionEl.querySelector(".updatedTableStyle table");
    if (!table) return null;
    const newTable = document.createElement("table");
    const thead = table.querySelector("thead");
    if (thead) {
      const headerRow2 = thead.querySelector("tr");
      if (headerRow2) {
        const tr = document.createElement("tr");
        headerRow2.querySelectorAll("th").forEach((th) => {
          const newTh = document.createElement("th");
          newTh.textContent = th.textContent.trim();
          tr.appendChild(newTh);
        });
        newTable.appendChild(tr);
      }
    }
    const tbody = table.querySelector("tbody");
    if (tbody) {
      tbody.querySelectorAll("tr").forEach((row) => {
        const tr = document.createElement("tr");
        row.querySelectorAll("th, td").forEach((cell) => {
          const td = document.createElement("td");
          const link = cell.querySelector("a");
          if (link) {
            const a = document.createElement("a");
            a.setAttribute("href", link.getAttribute("href") || "");
            a.textContent = link.textContent.trim();
            td.appendChild(a);
          } else if (cell.querySelector("ul")) {
            const ul = document.createElement("ul");
            cell.querySelectorAll("li").forEach((li) => {
              const newLi = document.createElement("li");
              newLi.textContent = li.textContent.trim();
              ul.appendChild(newLi);
            });
            td.appendChild(ul);
          } else {
            td.textContent = cell.textContent.trim();
          }
          tr.appendChild(td);
        });
        newTable.appendChild(tr);
      });
    }
    const blockTable = document.createElement("table");
    const headerRow = document.createElement("tr");
    const headerCell = document.createElement("th");
    headerCell.textContent = "Table (comparison)";
    headerRow.appendChild(headerCell);
    blockTable.appendChild(headerRow);
    const contentRow = document.createElement("tr");
    const contentCell = document.createElement("td");
    contentCell.appendChild(newTable);
    contentRow.appendChild(contentCell);
    blockTable.appendChild(contentRow);
    return blockTable;
  }
  function parseFindYourFitCTA(sectionEl, { document }) {
    const results = [];
    const h2 = sectionEl.querySelector("h2");
    if (h2) {
      const heading = document.createElement("h2");
      heading.textContent = h2.textContent.trim();
      results.push(heading);
    }
    const btn = sectionEl.querySelector(".buttonGroup button, .buttonGroup a");
    if (btn) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = btn.textContent.trim();
      p.appendChild(strong);
      results.push(p);
    }
    return results;
  }
  function parseCardsBenefit(sectionEl, { document }) {
    const results = [];
    const h2 = sectionEl.querySelector("h2");
    if (h2) {
      const heading = document.createElement("h2");
      heading.textContent = h2.textContent.trim();
      results.push(heading);
    }
    const blips = sectionEl.querySelectorAll(".blip");
    if (blips.length > 0) {
      const cells = [];
      blips.forEach((blip) => {
        const cellFrag = document.createDocumentFragment();
        const link = blip.querySelector("a.imageLink");
        const headingP = blip.querySelector(".heading");
        const subHeadingP = blip.querySelector(".subHeading");
        if (headingP) {
          const h3 = document.createElement("h3");
          if (link) {
            const a = document.createElement("a");
            a.setAttribute("href", link.getAttribute("href") || "");
            a.textContent = headingP.textContent.trim();
            h3.appendChild(a);
          } else {
            h3.textContent = headingP.textContent.trim();
          }
          cellFrag.appendChild(h3);
        }
        if (subHeadingP) {
          const p = document.createElement("p");
          p.textContent = subHeadingP.textContent.trim();
          cellFrag.appendChild(p);
        }
        cells.push(["", cellFrag]);
      });
      results.push(createBlock(document, "Cards (benefit)", cells));
    }
    return results;
  }
  function parseColumnsFeatureDigital(sectionEl, { document }) {
    const results = [];
    const h2 = sectionEl.querySelector("h2");
    if (h2) {
      const heading = document.createElement("h2");
      heading.textContent = h2.textContent.trim();
      results.push(heading);
    }
    const columnar = sectionEl.querySelector(".columnarContainer");
    if (!columnar) return results;
    const cols = columnar.querySelectorAll('[class*="columnar-container"]');
    const colFrags = [];
    cols.forEach((col) => {
      const frag = document.createDocumentFragment();
      const img = col.querySelector(".imageContainer img");
      const paragraphs = col.querySelectorAll(".paragraph p");
      if (img) {
        const newImg = document.createElement("img");
        newImg.setAttribute("src", img.getAttribute("src") || "");
        newImg.setAttribute("alt", img.getAttribute("alt") || "");
        frag.appendChild(newImg);
      } else if (paragraphs.length > 0) {
        paragraphs.forEach((p) => {
          const text = p.textContent.trim();
          if (text) {
            const newP = document.createElement("p");
            const strong = p.querySelector("strong");
            if (strong) {
              const newStrong = document.createElement("strong");
              newStrong.textContent = strong.textContent.trim();
              newP.appendChild(newStrong);
              const br = p.querySelector("br");
              if (br && br.nextSibling) {
                newP.appendChild(document.createElement("br"));
                newP.appendChild(document.createTextNode(br.nextSibling.textContent.trim()));
              }
            } else {
              newP.textContent = text;
            }
            frag.appendChild(newP);
          }
        });
      }
      colFrags.push(frag);
    });
    if (colFrags.length > 0) {
      results.push(createBlock(document, "Columns (feature)", [colFrags]));
    }
    return results;
  }
  function parseInPersonCTA(sectionEl, { document }) {
    const results = [];
    const h2 = sectionEl.querySelector("h2");
    if (h2) {
      const heading = document.createElement("h2");
      heading.textContent = h2.textContent.trim();
      results.push(heading);
    }
    const cta = sectionEl.querySelector(".btn_container a");
    if (cta) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href") || "");
      a.textContent = cta.textContent.trim();
      p.appendChild(a);
      results.push(p);
    }
    return results;
  }
  function parseColumnsContact(sectionEl, { document }) {
    const frag = document.createDocumentFragment();
    const h2 = sectionEl.querySelector("h2");
    if (h2) {
      const heading = document.createElement("h2");
      heading.textContent = h2.textContent.trim();
      frag.appendChild(heading);
    }
    const hoursPs = sectionEl.querySelectorAll("#paragraph_11 p");
    hoursPs.forEach((p) => {
      const text = p.textContent.trim();
      if (text) {
        const newP = document.createElement("p");
        newP.textContent = text;
        frag.appendChild(newP);
      }
    });
    const phoneLink = sectionEl.querySelector('a[href^="tel:"]');
    if (phoneLink) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", phoneLink.getAttribute("href") || "");
      a.textContent = phoneLink.textContent.trim();
      p.appendChild(a);
      frag.appendChild(p);
    }
    const cta = sectionEl.querySelector("a.secondary-button, a.primary-button");
    if (cta) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href") || "");
      a.textContent = cta.textContent.trim();
      p.appendChild(a);
      frag.appendChild(p);
    }
    return createBlock(document, "Columns (contact)", [[frag]]);
  }
  function parseDisclosures(sectionEl, { document }) {
    const results = [];
    const ol = sectionEl.querySelector("ol");
    if (ol) {
      const newOl = document.createElement("ol");
      ol.querySelectorAll("li").forEach((li) => {
        const newLi = document.createElement("li");
        const p = li.querySelector("p");
        if (p) {
          const newP = document.createElement("p");
          newP.innerHTML = "";
          p.childNodes.forEach((child) => {
            if (child.nodeType === 3) {
              newP.appendChild(document.createTextNode(child.textContent));
            } else if (child.nodeName === "A") {
              const a = document.createElement("a");
              a.setAttribute("href", child.getAttribute("href") || "");
              a.textContent = child.textContent.trim();
              newP.appendChild(a);
            } else {
              newP.appendChild(document.createTextNode(child.textContent));
            }
          });
          newLi.appendChild(newP);
        } else {
          newLi.textContent = li.textContent.trim();
        }
        newOl.appendChild(newLi);
      });
      results.push(newOl);
    }
    const ul = sectionEl.querySelector("ul");
    if (ul) {
      const newUl = document.createElement("ul");
      ul.querySelectorAll("li").forEach((li) => {
        const newLi = document.createElement("li");
        newLi.textContent = li.textContent.trim();
        newUl.appendChild(newLi);
      });
      results.push(newUl);
    }
    return results;
  }
  var SECTION_HANDLERS = {
    "section-1": (sectionEl, ctx) => [parseHeroBanner(sectionEl, ctx)],
    "section-2": (sectionEl, ctx) => [parseColumnsFeatureIntro(sectionEl, ctx)],
    "section-3": (sectionEl, ctx) => parseCardsPricing(sectionEl, ctx),
    "section-4": (sectionEl, ctx) => {
      const table = parseTableComparison(sectionEl, ctx);
      return table ? [table] : [];
    },
    "section-5": (sectionEl, ctx) => parseFindYourFitCTA(sectionEl, ctx),
    "section-6": (sectionEl, ctx) => parseCardsBenefit(sectionEl, ctx),
    "section-7": (sectionEl, ctx) => parseColumnsFeatureDigital(sectionEl, ctx),
    "section-8": (sectionEl, ctx) => parseInPersonCTA(sectionEl, ctx),
    "section-9": (sectionEl, ctx) => [parseColumnsContact(sectionEl, ctx)],
    "section-10": (sectionEl, ctx) => parseDisclosures(sectionEl, ctx)
  };
  function transform(hookName, element, payload) {
    const { document, url } = payload;
    if (hookName === "beforeTransform") {
      const removeSelectors = [
        "header",
        "nav",
        "footer",
        ".globalNav",
        ".globalFooter",
        "#signInModal",
        ".modal-button-modal",
        ".modal",
        ".overlay",
        ".signInBox-container",
        ".LeftProductAd",
        ".mobile-personal-checking-comparison"
      ];
      removeSelectors.forEach((sel) => {
        const els = document.querySelectorAll(sel);
        els.forEach((el) => el.remove());
      });
    }
    if (hookName === "afterTransform") {
      const results = [];
      SECTIONS.forEach((section, index) => {
        const sectionEl = document.querySelector(section.selector);
        if (!sectionEl) return;
        if (index > 0) {
          results.push(createSectionBreak(document));
        }
        const handler = SECTION_HANDLERS[section.id];
        if (handler) {
          const nodes = handler(sectionEl, { document });
          if (nodes) {
            nodes.forEach((node) => {
              if (node) results.push(node);
            });
          }
        }
        if (section.style) {
          results.push(createSectionMetadata(document, section.style));
        }
      });
      const pageMeta = extractPageMetadata(document);
      if (Object.keys(pageMeta).length > 0) {
        results.push(createSectionBreak(document));
        results.push(createMetadata(document, pageMeta));
      }
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      results.forEach((node) => {
        element.appendChild(node);
      });
    }
    return element;
  }

  // tools/importer/import-product-detail.js
  var transformers = [transform];
  var PAGE_TEMPLATE = {
    name: "product-detail",
    description: "Product detail page with hero, intro, product comparison cards, feature comparison table, benefits grid, and digital banking features",
    urls: [
      "http://localhost:8765/cleaned.html"
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero",
        selector: ".hero-image",
        style: null,
        blocks: ["hero-banner"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Intro",
        selector: ".intro-section-container",
        style: "teal",
        blocks: ["columns-feature"],
        defaultContent: []
      },
      {
        id: "section-3",
        name: "Product Cards",
        selector: "#padded-container0",
        style: null,
        blocks: ["cards-pricing"],
        defaultContent: ["#padded-container0 h2:first-of-type", "#padded-container0 > .limit-max-width-homepage > .paragraph:last-child"]
      },
      {
        id: "section-4",
        name: "Comparison Table",
        selector: "#CompBox",
        style: "green",
        blocks: ["table-comparison"],
        defaultContent: []
      },
      {
        id: "section-5",
        name: "Find Your Fit CTA",
        selector: "#padded-container4",
        style: "green",
        blocks: [],
        defaultContent: ["#padded-container4 h2", "#padded-container4 .buttonGroup"]
      },
      {
        id: "section-6",
        name: "Benefits Grid",
        selector: '[id="8pack"]',
        style: null,
        blocks: ["cards-benefit"],
        defaultContent: ['[id="8pack"] h2']
      },
      {
        id: "section-7",
        name: "Digital Banking Feature",
        selector: "#padded-container6",
        style: "teal",
        blocks: ["columns-feature"],
        defaultContent: ["#padded-container6 h2"]
      },
      {
        id: "section-8",
        name: "In-Person CTA",
        selector: "#padded-container8",
        style: null,
        blocks: [],
        defaultContent: ["#padded-container8 h2", "#padded-container8 a"]
      },
      {
        id: "section-9",
        name: "Contact Info",
        selector: ".left-panel-link-container",
        style: "green",
        blocks: ["columns-contact"],
        defaultContent: []
      },
      {
        id: "section-10",
        name: "Disclosures",
        selector: "#disclosures",
        style: null,
        blocks: [],
        defaultContent: ["#disclosures ol", "#disclosures ul"]
      }
    ],
    blocks: [
      {
        name: "hero-banner",
        instances: [".hero-image"]
      },
      {
        name: "columns-feature",
        instances: [
          ".intro-section-container .intro-section",
          "#padded-container6 .columnarContainer"
        ]
      },
      {
        name: "cards-pricing",
        instances: ["#padded-container0 .columnarContainer"]
      },
      {
        name: "table-comparison",
        instances: ["#CompBox .table-component"]
      },
      {
        name: "cards-benefit",
        instances: ['[id="8pack"] .timelineBlips']
      },
      {
        name: "columns-contact",
        instances: [".left-panel-link-container"]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = {
      ...payload,
      template: PAGE_TEMPLATE
    };
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var import_product_detail_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      ) || "/personal/personal-checking";
      return [{
        element: main,
        path,
        report: {
          title: document.title || "Personal Checking Accounts",
          template: PAGE_TEMPLATE.name,
          blocks: PAGE_TEMPLATE.blocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_product_detail_exports);
})();
