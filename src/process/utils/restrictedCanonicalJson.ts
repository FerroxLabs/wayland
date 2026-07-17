/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

export function requireWellFormedUnicode(value: string, label: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error(`${label} contains an unpaired UTF-16 surrogate.`);
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new Error(`${label} contains an unpaired UTF-16 surrogate.`);
    }
  }
}

export function compareUnicodeCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalJson(value: unknown, ancestors: Set<object>): string {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'string') {
    requireWellFormedUnicode(value, 'Canonical JSON string');
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Canonical JSON forbids non-finite numbers.');
    return JSON.stringify(value);
  }
  if (typeof value !== 'object') throw new Error('Canonical JSON contains an unsupported value.');
  if (ancestors.has(value)) throw new Error('Canonical JSON contains a cycle.');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const ownNames = Object.getOwnPropertyNames(value).filter((key) => key !== 'length');
      if (
        Object.getOwnPropertySymbols(value).length > 0 ||
        ownNames.length !== value.length ||
        ownNames.some((key, index) => key !== String(index))
      ) {
        throw new Error('Canonical JSON forbids sparse arrays and non-index array properties.');
      }
      return `[${value.map((entry) => canonicalJson(entry, ancestors)).join(',')}]`;
    }
    if (!isPlainObject(value)) throw new Error('Canonical JSON requires plain objects.');
    if (Object.getOwnPropertySymbols(value).length > 0) throw new Error('Canonical JSON forbids symbol properties.');
    const propertyNames = Object.getOwnPropertyNames(value);
    for (const key of propertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !('value' in descriptor)) {
        throw new Error('Canonical JSON requires enumerable data properties.');
      }
    }
    return `{${propertyNames
      .toSorted(compareUnicodeCodeUnits)
      .map((key) => {
        requireWellFormedUnicode(key, 'Canonical JSON object key');
        return `${JSON.stringify(key)}:${canonicalJson(value[key], ancestors)}`;
      })
      .join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

/** Serialize the restricted schema using RFC 8785/JCS ordering and ECMAScript primitives. */
export function canonicalizeRestrictedJson(value: unknown): Buffer {
  return Buffer.from(canonicalJson(value, new Set()), 'utf8');
}
