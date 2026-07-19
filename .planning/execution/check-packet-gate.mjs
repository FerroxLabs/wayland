#!/usr/bin/env node

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkGate } from './packet-gate-lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '../..')
const manifestPath = resolve(here, 'PACKET-GATES.json')
const manifest = JSON.parse(await (await import('node:fs/promises')).readFile(manifestPath, 'utf8'))
const gateId = process.argv[2]

try {
  const result = await checkGate({
    gateId,
    projectRoot,
    receiptDirectory: resolve(projectRoot, manifest.receipt_directory),
    manifestPath,
    contractsPath: resolve(projectRoot, manifest.contract_manifest),
    trustRootPath: resolve(projectRoot, manifest.trust_root),
  })
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.ok ? 0 : 1)
} catch (error) {
  console.error(error.message)
  process.exit(2)
}
