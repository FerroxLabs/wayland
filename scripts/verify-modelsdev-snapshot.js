#!/usr/bin/env node
'use strict';

const path = require('path');
const { verifyModelsSnapshot } = require('./verify-packaged-resources');

const snapshotPath = path.resolve(
  process.argv[2] || path.join(__dirname, '..', 'resources', 'modelsdev-snapshot.json')
);
if (!verifyModelsSnapshot(snapshotPath)) {
  throw new Error(`Committed models.dev snapshot failed pinned size, SHA-256, or schema validation: ${snapshotPath}`);
}
console.log(`[verify-modelsdev-snapshot] verified immutable offline floor: ${snapshotPath}`);
