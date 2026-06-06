// Vendored from npm pptx2json@0.0.10 (abandoned) - see M22.
// Upstream: https://github.com/x1-/pptx2json (single-maintainer "x1-", no
// upstream activity for years). Vendored verbatim to remove supply-chain
// dependency on the abandoned package while preserving the exact structured
// per-slide JSON output shape that ConversionService.pptToJson relies on.
//
// Original source: node_modules/pptx2json/index.js
// Original license: MIT, Copyright (c) 2020 x1-
// See LICENSE in this directory for the full upstream notice.

/**
 * @module pptx2json
 * @fileoverview Convert Open Office XML pptx buffer to JSON and ecoding XML
 *
 * @author x1- <viva008@gmail.com>
 */

'use strict';

// ESM imports for vite/rollup. Original CJS requires worked under node_modules
// resolution but rollup's strict ESM parsing of `src/vendor/` rejects them.
import { promises as fs } from 'fs';
import path from 'path';
import assert from 'assert';
import JSZip from 'jszip';
import xml2js from 'xml2js';

const PresentationXML = 'ppt/presentation.xml';

/**
 * @class PPTX2Json
 *
 */
class PPTX2Json {
  /**
   * @method constructor
   *
   * constructor for PPTX2Json
   *
   * @param {Object} options {
   *   'jszipBinary': nodebuffer(default) | blob | arraybuffer | uint8array | nodestream, see: https://stuk.github.io/jszip/documentation/api_jszip/support.html
   *   'jszipGenerateType': nodebuffer(default) | blob | arraybuffer | uint8array | nodestream
   * }
   * @returns PPTX2Json
   */
  constructor(options) {
    this.options = options || {};
  }

  async jszip2json(jszip) {
    const json = {};
    await Promise.all(
      Object.keys(jszip.files).map(async (relativePath) => {
        const file = jszip.file(relativePath);
        const ext = path.extname(relativePath);

        let content;
        if (!file || file.dir) {
          return;
        } else if (ext === '.xml' || ext === '.rels') {
          const xml = await file.async('string');
          content = await xml2js.parseStringPromise(xml);
        } else {
          content = await file.async(this.options['jszipBinary'] || 'nodebuffer'); // images, audio files, movies, etc.
        }
        json[relativePath] = content;
      })
    );
    return json;
  }

  /**
   * @method toJson
   *
   * Parse PowerPoint file to Json.
   *
   * @param {string} file Give a path of PowerPoint.
   * @returns {Promise} json
   */
  async toJson(file) {
    assert.equal(typeof file, 'string', "argument 'file' must be a string");

    const buff = await fs.readFile(file);
    const zip = await JSZip().loadAsync(buff);

    return await this.jszip2json(zip);
  }

  /**
   * @method buffer2json
   *
   * Parse PowerPoint file to Json.
   *
   * @param {string} buffer Binary contents of a PowerPoint file.
   * @returns {Promise} json
   */
  async buffer2json(buff) {
    const zip = await JSZip().loadAsync(buff);

    return await this.jszip2json(zip);
  }

  json2jszip(json) {
    const zip = new JSZip();
    Object.keys(json).forEach((relativePath) => {
      const ext = path.extname(relativePath);
      if (ext === '.xml' || ext === '.rels') {
        const builder = new xml2js.Builder({
          renderOpts: {
            pretty: false,
          },
        });
        const xml = builder.buildObject(json[relativePath]);
        zip.file(relativePath, xml);
      } else {
        zip.file(relativePath, json[relativePath]);
      }
    });
    return zip;
  }

  /**
   * @method toPPTX
   *
   * Convert json to pptx.
   * It is available to add or delete slides, media before call this method.
   *
   * @param {Object} json created from PowerPoint XMLs.
   * @param {Object} options {
   *   'file': If you want to write file, please give the output path. If not, return buffer.
   * }
   * @returns {Promise} Buffer if not file, otherwise empty.
   */
  async toPPTX(json, options) {
    options = options || {};

    assert.equal(typeof json, 'object', "argument 'json' must be an object");
    assert.equal(typeof options, 'object', "argument 'options' must be an object");

    const zip = this.json2jszip(json);

    let buf = await zip.generateAsync({
      type: this.options['jszipGenerateType'] || 'nodebuffer',
    });
    if (!options.file) {
      return buf;
    }
    return await fs.writeFile(options.file, buf);
  }

  /**
   * @method getMaxSlideIds
   *
   * Find max id and r:id in the slides at presentation.xml.
   * If any slides do not present at presentation.xml, returns {'id': -1, 'rid': -1}.
   * notice: 'rid' is represented as {'r:id':'rId1'} at presentation.xml, but this method returns Number.
   *
   * @param {Object} json created from PowerPoint XMLs.
   * @returns {Object} ex) {'id': 27, 'rid': 7};
   */
  getMaxSlideIds(json) {
    let mx = { id: -1, rid: -1 };

    if (!(PresentationXML in json)) {
      return mx;
    }
    const presen = json[PresentationXML];

    if (!('p:presentation' in json[PresentationXML]) || !('p:sldIdLst' in presen['p:presentation'])) {
      return mx;
    }

    presen['p:presentation']['p:sldIdLst'].forEach((xs) => {
      const maxId = xs['p:sldId'].reduce((a, b) => {
        const bId = parseInt(b.$.id);
        return a > bId ? a : bId;
      }, -1);
      const maxRid = xs['p:sldId'].reduce((a, b) => {
        const bId = parseInt(b.$['r:id'].replace('rId', ''));
        return a > bId ? a : bId;
      }, -1);
      mx.id = Math.max(maxId, mx.id);
      mx.rid = Math.max(maxRid, mx.rid);
    });
    return mx;
  }

  /**
   * @method getSlideLayoutHash
   *
   * Find the slideLayouts in json, and generate Hash has SlideLayoutType as a key and a file path as a value.
   * If SlideLayoutType does not appear in xml, exclude these slideLayouts.
   * SlideLayoutType see: https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-ppt/df8f3d7b-db67-47dc-8c89-20f5cbbf0fa9
   *
   * @param {Object} json created from PowerPoint XMLs.
   * @returns {Object} Key: SlideLayoutType, Value: file path.
   */
  getSlideLayoutTypeHash(json) {
    const table = {};
    const layouts = Object.keys(json).filter(
      (key) => /^ppt\/slideLayouts\/[^_]+\.xml$/.test(key) && json[key]['p:sldLayout']
    );
    if (!layouts) {
      return table;
    }
    layouts.forEach((layout) => {
      if (!json[layout]['p:sldLayout'].$.type) {
        return;
      }
      table[json[layout]['p:sldLayout'].$.type] = layout;
    });
    return table;
  }
}

export default PPTX2Json;
