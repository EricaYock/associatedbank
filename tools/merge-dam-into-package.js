#!/usr/bin/env node
/**
 * Merges DAM image assets into the existing JCR content package.
 *
 * Reads the existing associatedbank.zip, adds DAM asset nodes and image binaries,
 * updates filter.xml, and outputs a combined package.
 *
 * Usage: node tools/merge-dam-into-package.js
 *
 * Output: migration-work/packages/associatedbank.zip (overwritten with merged package)
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { createRequire } from 'module';

const require = createRequire(
  join('/home/node/.excat-marketplace/excat/tools/excatops-mcp', 'package.json'),
);
const JSZip = require('jszip');

const IMAGES_DIR = join(process.cwd(), 'content', 'images');
const PACKAGE_PATH = join(process.cwd(), 'migration-work', 'packages', 'associatedbank.zip');
const DAM_ROOT = 'content/dam/associatedbank/content/images';

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function getMimeType(filename) {
  const ext = extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function getFolderContentXml(title) {
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

async function mergePackage() {
  // Read existing package
  console.log('Reading existing content package...');
  const existingZipData = await readFile(PACKAGE_PATH);
  const zip = await JSZip.loadAsync(existingZipData);

  // Read existing filter.xml
  const filterXmlContent = await zip.file('META-INF/vault/filter.xml').async('string');
  console.log('Existing filter.xml:', filterXmlContent.trim());

  // Get image files
  const files = await readdir(IMAGES_DIR);
  const imageFiles = files.filter((f) => {
    const ext = extname(f).toLowerCase();
    return Object.keys(MIME_TYPES).includes(ext);
  });

  console.log(`\nAdding ${imageFiles.length} images to package...`);

  // Add DAM folder structure
  const damFolders = [
    ['jcr_root/content/dam/.content.xml', 'DAM'],
    ['jcr_root/content/dam/associatedbank/.content.xml', 'associatedbank'],
    ['jcr_root/content/dam/associatedbank/content/.content.xml', 'content'],
    ['jcr_root/content/dam/associatedbank/content/images/.content.xml', 'images'],
  ];

  for (const [path, title] of damFolders) {
    zip.file(path, getFolderContentXml(title));
  }

  // Add each image as a DAM asset
  for (const filename of imageFiles) {
    const filePath = join(IMAGES_DIR, filename);
    const mimeType = getMimeType(filename);
    const fileStat = await stat(filePath);
    const imageData = await readFile(filePath);

    const assetBase = `jcr_root/${DAM_ROOT}/${filename}`;

    // Asset node definition
    zip.file(`${assetBase}/.content.xml`, getAssetContentXml(filename, mimeType));

    // Original rendition (the actual image binary)
    zip.file(`${assetBase}/_jcr_content/renditions/original`, imageData);

    console.log(`  + ${filename} (${mimeType}, ${(fileStat.size / 1024).toFixed(1)}KB)`);
  }

  // Update filter.xml to include DAM path
  const updatedFilterXml = filterXmlContent.replace(
    '</workspaceFilter>',
    `  <filter root="/${DAM_ROOT}" mode="merge"></filter>\n</workspaceFilter>`,
  );
  zip.file('META-INF/vault/filter.xml', updatedFilterXml);
  console.log('\nUpdated filter.xml:', updatedFilterXml.trim());

  // Write merged package
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  await writeFile(PACKAGE_PATH, zipBuffer);

  const packageStat = await stat(PACKAGE_PATH);
  console.log(`\nMerged package written: ${PACKAGE_PATH}`);
  console.log(`Package size: ${(packageStat.size / 1024).toFixed(1)}KB`);
  console.log(`\nContains: ${imageFiles.length} DAM assets + page content`);
}

mergePackage().catch((err) => {
  console.error('Error merging package:', err);
  process.exit(1);
});
