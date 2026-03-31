#!/usr/bin/env node
/**
 * Builds a complete AEM content package with both page content and DAM assets.
 *
 * Reads JCR XML files from migration-work/jcr-content/ and images from content/images/,
 * combines them into a single installable AEM content package.
 *
 * Usage: node tools/build-content-package.js
 *
 * Output: migration-work/packages/associatedbank.zip
 */

import { readdir, readFile, writeFile, stat, mkdir } from 'fs/promises';
import { join, extname, relative, basename, dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(
  join('/home/node/.excat-marketplace/excat/tools/excatops-mcp', 'package.json'),
);
const JSZip = require('jszip');

const JCR_CONTENT_DIR = join(process.cwd(), 'migration-work', 'jcr-content');
const IMAGES_DIR = join(process.cwd(), 'content', 'images');
const OUTPUT_DIR = join(process.cwd(), 'migration-work', 'packages');
const OUTPUT_FILE = join(OUTPUT_DIR, 'associatedbank.zip');

const SITE_NAME = 'associatedbank';
const DAM_PATH = 'content/dam/associatedbank/content/images';
const PACKAGE_GROUP = 'associatedbank';
const PACKAGE_NAME = 'associatedbank';
const PACKAGE_VERSION = '1.0.0';

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function getMimeType(filename) {
  return MIME_TYPES[extname(filename).toLowerCase()] || 'application/octet-stream';
}

function getPropertiesXml() {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <entry key="name">${PACKAGE_NAME}</entry>
  <entry key="group">${PACKAGE_GROUP}</entry>
  <entry key="version">${PACKAGE_VERSION}</entry>
  <entry key="description">Associated Bank content and DAM assets</entry>
  <entry key="createdBy">excat-migration</entry>
  <entry key="created">${now}</entry>
  <entry key="lastModifiedBy">excat-migration</entry>
  <entry key="lastModified">${now}</entry>
</properties>`;
}

function getFolderContentXml(title, primaryType) {
  if (primaryType === 'cq:Page') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0"
    xmlns:cq="http://www.day.com/jcr/cq/1.0"
    jcr:primaryType="cq:Page"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0"
    xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
    jcr:primaryType="sling:OrderedFolder"
    jcr:title="${title}"/>`;
}

function getAssetContentXml(filename, mimeType) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0"
    xmlns:dam="http://www.day.com/dam/1.0"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="dam:Asset">
  <jcr:content
      jcr:primaryType="dam:AssetContent">
    <metadata
        jcr:primaryType="nt:unstructured"
        dam:Filename="${filename}"
        dc:format="${mimeType}"/>
    <renditions jcr:primaryType="nt:folder"/>
  </jcr:content>
</jcr:root>`;
}

async function findXmlFiles(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findXmlFiles(fullPath));
    } else if (entry.name.endsWith('.xml')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function buildPackage() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const zip = new JSZip();
  const filterRoots = [];

  // === PART 1: Page content from JCR XML files ===
  console.log('Adding page content...');

  const xmlFiles = await findXmlFiles(JCR_CONTENT_DIR);

  // Add site root nodes
  zip.file('jcr_root/content/.content.xml', getFolderContentXml('content', 'sling:OrderedFolder'));
  zip.file(`jcr_root/content/${SITE_NAME}/.content.xml`, getFolderContentXml(SITE_NAME, 'cq:Page'));

  for (const xmlPath of xmlFiles) {
    const relPath = relative(JCR_CONTENT_DIR, xmlPath);
    const pageName = basename(relPath, '.xml');
    const pageDir = dirname(relPath);

    // Build the JCR page path
    let jcrPagePath;
    if (pageDir === '.') {
      jcrPagePath = `content/${SITE_NAME}/${pageName}`;
    } else {
      jcrPagePath = `content/${SITE_NAME}/${pageDir}/${pageName}`;

      // Add intermediate folder nodes
      const parts = pageDir.split('/');
      let folderPath = `content/${SITE_NAME}`;
      for (const part of parts) {
        folderPath = `${folderPath}/${part}`;
        const folderXmlPath = `jcr_root/${folderPath}/.content.xml`;
        if (!zip.files[folderXmlPath]) {
          zip.file(folderXmlPath, getFolderContentXml(part, 'cq:Page'));
        }
      }
    }

    // Add the page .content.xml
    const xmlContent = await readFile(xmlPath, 'utf-8');
    zip.file(`jcr_root/${jcrPagePath}/.content.xml`, xmlContent);
    filterRoots.push(`/${jcrPagePath}`);
    console.log(`  + /${jcrPagePath}`);
  }

  // === PART 2: DAM assets ===
  console.log('\nAdding DAM assets...');

  const imageFiles = (await readdir(IMAGES_DIR)).filter((f) =>
    Object.keys(MIME_TYPES).includes(extname(f).toLowerCase()),
  );

  // DAM folder structure
  const damFolders = [
    ['jcr_root/content/dam/.content.xml', 'DAM'],
    ['jcr_root/content/dam/associatedbank/.content.xml', 'associatedbank'],
    ['jcr_root/content/dam/associatedbank/content/.content.xml', 'content'],
    ['jcr_root/content/dam/associatedbank/content/images/.content.xml', 'images'],
  ];

  for (const [path, title] of damFolders) {
    zip.file(path, getFolderContentXml(title, 'sling:OrderedFolder'));
  }

  for (const filename of imageFiles) {
    const filePath = join(IMAGES_DIR, filename);
    const mimeType = getMimeType(filename);
    const fileStat = await stat(filePath);
    const imageData = await readFile(filePath);

    const assetBase = `jcr_root/${DAM_PATH}/${filename}`;
    zip.file(`${assetBase}/.content.xml`, getAssetContentXml(filename, mimeType));
    zip.file(`${assetBase}/_jcr_content/renditions/original`, imageData);

    console.log(`  + ${filename} (${mimeType}, ${(fileStat.size / 1024).toFixed(1)}KB)`);
  }

  filterRoots.push(`/${DAM_PATH}`);

  // === Build filter.xml ===
  const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
${filterRoots.map((r) => `  <filter root="${r}" mode="merge"></filter>`).join('\n')}
</workspaceFilter>`;

  zip.file('META-INF/vault/filter.xml', filterXml);
  zip.file('META-INF/vault/properties.xml', getPropertiesXml());

  // === Write package ===
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  await writeFile(OUTPUT_FILE, zipBuffer);

  const packageStat = await stat(OUTPUT_FILE);
  console.log(`\nPackage: ${OUTPUT_FILE}`);
  console.log(`Size: ${(packageStat.size / 1024).toFixed(1)}KB`);
  console.log(`Pages: ${xmlFiles.length}, DAM assets: ${imageFiles.length}`);
}

buildPackage().catch((err) => {
  console.error('Error building package:', err);
  process.exit(1);
});
