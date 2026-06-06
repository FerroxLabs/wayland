/**
 * Sanitize a JSON-schema so Google's Gemini function-calling validator accepts it.
 *
 * Gemini's function-declaration schema is a strict subset of OpenAPI 3.0. Unlike
 * OpenAI/Anthropic it rejects:
 *   - union `type` arrays (e.g. `['object','boolean']`) - must be a single string type
 *   - the structural keywords `oneOf` / `anyOf` / `allOf` / `not`
 *   - `$ref` / `$defs` / `definitions` / `$schema` / `patternProperties`
 *
 * This is a JSON-Schema-AWARE walker: it recurses through the keywords that hold
 * subschemas (`properties` values, `items`) and treats everything else as data.
 *
 * Critically it must NOT use the naive "if a node has `properties` but no `type`,
 * add `type:'object'`" heuristic. That heuristic mis-fires when a tool's schema
 * has a property literally named `properties` (e.g. Notion's `notion-create-pages`,
 * whose page objects carry a `properties` field): the recursion lands on the
 * `properties` MAP, sees a child named `properties`, and injects a bogus
 * `"type":"object"` *property* into the map - producing `"type":"object"` where a
 * subschema is expected and a `400 Invalid schema for function ...` from the API.
 * Walking by structure instead of by key-name presence avoids that entirely.
 */

// Keywords Gemini's function-calling schema does not support. Removed wholesale.
const UNSUPPORTED_KEYWORDS = new Set([
  'oneOf',
  'anyOf',
  'allOf',
  'not',
  '$ref',
  '$defs',
  '$schema',
  'definitions',
  'additionalProperties',
  'patternProperties',
]);

function collapseType(value: unknown): unknown {
  if (Array.isArray(value)) {
    const primary = value.find((t) => typeof t === 'string' && t.toLowerCase() !== 'null');
    return primary ? String(primary).toLowerCase() : 'object';
  }
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return value;
}

/** Recurse a single SCHEMA node. */
function sanitizeSchema(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(sanitizeSchema);
  }
  if (typeof node !== 'object' || node === null) {
    return node;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (UNSUPPORTED_KEYWORDS.has(key)) {
      continue;
    }
    if (key === 'type') {
      result.type = collapseType(value);
    } else if (key === 'properties' && value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // `properties` is a MAP of name -> subschema. Recurse each VALUE as a
      // schema; never treat the map itself as a schema node.
      const props: Record<string, unknown> = {};
      for (const [propName, propSchema] of Object.entries(value as Record<string, unknown>)) {
        props[propName] = sanitizeSchema(propSchema);
      }
      result.properties = props;
    } else if (key === 'items' || key === 'additionalItems') {
      // A subschema, or (tuple form) an array of subschemas.
      result[key] = Array.isArray(value) ? value.map(sanitizeSchema) : sanitizeSchema(value);
    } else {
      // Data keywords (description, required, enum, default, format, min/max...).
      // Leave untouched - union `type` arrays only ever appear under `type`,
      // which is handled above via the properties/items recursion.
      result[key] = value;
    }
  }
  return result;
}

/**
 * Deep-clone and normalize a tool parameter schema for the Gemini backend.
 * Returns a fresh object - never mutates the input. Non-object input yields a
 * minimal valid object schema (matching the library's OpenAI-path behaviour).
 */
export function sanitizeGeminiSchema(schema: unknown): unknown {
  if (typeof schema !== 'object' || schema === null) {
    return { type: 'object', properties: {} };
  }
  return sanitizeSchema(JSON.parse(JSON.stringify(schema)));
}
