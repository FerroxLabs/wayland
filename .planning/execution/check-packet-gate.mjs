#!/usr/bin/env node

import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkGate } from './packet-gate-lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '../..')
const manifestPath = resolve(here, 'PACKET-GATES.json')
const manifest = JSON.parse(await (await import('node:fs/promises')).readFile(manifestPath, 'utf8'))
const gateId = process.argv[2]
const trustRootPath = process.env.WAYLAND_GSD_TRUST_ROOT

if (!trustRootPath || !isAbsolute(trustRootPath)) {
  console.error('Authoritative execution requires the externally anchored wayland-gsd-gate verifier')
  process.exit(2)
}

try {
  const result = await checkGate({
    gateId,
    projectRoot,
    receiptDirectory: resolve(projectRoot, manifest.receipt_directory),
    manifestPath,
    contractsPath: resolve(projectRoot, manifest.contract_manifest),
    trustRootPath,
  })
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.ok ? 0 : 1)
} catch (error) {
  console.error(error.message)
  process.exit(2)
}
