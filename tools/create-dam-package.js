#!/usr/bin/env node
/**
 * Creates an AEM content package (.zip) for uploading images to AEM DAM.
 *
 * Usage: node tools/create-dam-package.js
 *
 * Output: migration-work/dam-assets-package.zip
 *
 * The package installs images into /content/dam/associatedbank/content/images/
 * and can be uploaded via CRX Package Manager at:
 *   https://<aem-author>/crx/packmgr/index.jsp
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { createRequire } from 'module';

const require = createRequire(
  join('/home/node/.excat-marketplace/excat/tools/excatops-mcp', 'package.json'),
);
const JSZip = require('jszip');

const IMAGES_DIR = join(process.cwd(), 'content', 'images');
const OUTPUT_FILE = join(process.cwd(), 'migration-work', 'dam-assets-package.zip');

const DAM_ROOT = '/content/dam/associatedbank/content/images';
const PACKAGE_GROUP = 'associatedbank';
const PACKAGE_NAME = 'dam-assets';
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
  const ext = extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function getFilterXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
  <filter root="${DAM_ROOT}" mode="merge"/>
</workspaceFilter>`;
}

function getPropertiesXml() {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <entry key="name">${PACKAGE_NAME}</entry>
  <entry key="group">${PACKAGE_GROUP}</entry>
  <entry key="version">${PACKAGE_VERSION}</entry>
  <entry key="description">DAM assets for Associated Bank migration</entry>
  <entry key="createdBy">excat-migration</entry>
  <entry key="created">${now}</entry>
  <entry key="lastModifiedBy">excat-migration</entry>
  <entry key="lastModified">${now}</entry>
</properties>`;
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

async function createPackage() {
  const files = await readdir(IMAGES_DIR);
  const imageFiles = files.filter((f) => {
    const ext = extname(f).toLowerCase();
    return Object.keys(MIME_TYPES).includes(ext);
  });

  if (imageFiles.length === 0) {
    console.error('No image files found in', IMAGES_DIR);
    process.exit(1);
  }

  console.log(`Found ${imageFiles.length} images to package`);

  const zip = new JSZip();

  // META-INF
  zip.file('META-INF/vault/filter.xml', getFilterXml());
  zip.file('META-INF/vault/properties.xml', getPropertiesXml());

  // Folder structure .content.xml files
  const folders = [
    ['jcr_root/content/dam/.content.xml', 'DAM'],
    ['jcr_root/content/dam/associatedbank/.content.xml', 'associatedbank'],
    ['jcr_root/content/dam/associatedbank/content/.content.xml', 'content'],
    ['jcr_root/content/dam/associatedbank/content/images/.content.xml', 'images'],
  ];

  for (const [path, title] of folders) {
    zip.file(path, getFolderContentXml(title));
  }

  // Assets
  for (const filename of imageFiles) {
    const filePath = join(IMAGES_DIR, filename);
    const mimeType = getMimeType(filename);
    const fileStat = await stat(filePath);
    const imageData = await readFile(filePath);

    const assetBase = `jcr_root/content/dam/associatedbank/content/images/${filename}`;

    // Asset node definition
    zip.file(`${assetBase}/.content.xml`, getAssetContentXml(filename, mimeType));

    // Original rendition (the actual image binary)
    zip.file(`${assetBase}/_jcr_content/renditions/original`, imageData);

    console.log(`  + ${filename} (${mimeType}, ${(fileStat.size / 1024).toFixed(1)}KB)`);
  }

  // Generate ZIP
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  await writeFile(OUTPUT_FILE, zipBuffer);

  console.log(`\nPackage created: ${OUTPUT_FILE}`);
  console.log(`Package size: ${(zipBuffer.length / 1024).toFixed(1)}KB`);
  console.log(`\nImages will install to: ${DAM_ROOT}/`);
  console.log(`\nTo install, upload this package via CRX Package Manager at:`);
  console.log(
    '  https://author-p178211-e1869897.adobeaemcloud.com/crx/packmgr/index.jsp',
  );
}

createPackage().catch((err) => {
  console.error('Error creating package:', err);
  process.exit(1);
});
