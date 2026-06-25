import { describe, it, expect } from 'vitest';
import { sanitizeGeminiSchema } from '@process/agent/gemini/cli/utils/geminiSchemaFilter';

describe('sanitizeGeminiSchema', () => {
  it('collapses a union type array to its primary non-null type', () => {
    const out = sanitizeGeminiSchema({ type: ['object', 'boolean'], properties: {} }) as Record<string, unknown>;
    expect(out.type).toBe('object');
    expect(out.properties).toEqual({});
  });

  it('drops the null variant from a [type, null] union', () => {
    const out = sanitizeGeminiSchema({ type: ['string', 'null'] }) as Record<string, unknown>;
    expect(out.type).toBe('string');
  });

  it('strips anyOf/oneOf/allOf/$ref/$defs/additionalProperties that Gemini rejects', () => {
    const out = sanitizeGeminiSchema({
      type: 'object',
      anyOf: [{ type: 'string' }],
      oneOf: [{ type: 'number' }],
      allOf: [{ type: 'boolean' }],
      $ref: '#/$defs/Foo',
      $defs: { Foo: { type: 'string' } },
      additionalProperties: false,
      properties: {},
    }) as Record<string, unknown>;
    expect(out).not.toHaveProperty('anyOf');
    expect(out).not.toHaveProperty('oneOf');
    expect(out).not.toHaveProperty('allOf');
    expect(out).not.toHaveProperty('$ref');
    expect(out).not.toHaveProperty('$defs');
    expect(out).not.toHaveProperty('additionalProperties');
    expect(out.type).toBe('object');
  });

  it('recurses into nested properties and collapses their union types', () => {
    const out = sanitizeGeminiSchema({
      type: 'object',
      properties: { body: { type: ['object', 'boolean'] } },
    }) as { properties: { body: { type: unknown } } };
    expect(out.properties.body.type).toBe('object');
  });

  it('recurses into array items', () => {
    const out = sanitizeGeminiSchema({
      type: 'array',
      items: { type: ['string', 'null'], $ref: '#/x' },
    }) as { items: Record<string, unknown> };
    expect(out.items.type).toBe('string');
    expect(out.items).not.toHaveProperty('$ref');
  });

  it('falls back to object when a union has no usable non-null type', () => {
    const out = sanitizeGeminiSchema({ type: ['null'] }) as Record<string, unknown>;
    expect(out.type).toBe('object');
  });

  it('passes a clean single-type schema through unchanged in shape', () => {
    const input = {
      type: 'object',
      properties: { name: { type: 'string', description: 'a name' } },
      required: ['name'],
    };
    const out = sanitizeGeminiSchema(input);
    expect(out).toEqual(input);
  });

  it('does not mutate the input schema', () => {
    const input = { type: ['object', 'null'], properties: { a: { type: ['string', 'null'] } } };
    const snapshot = JSON.parse(JSON.stringify(input));
    sanitizeGeminiSchema(input);
    expect(input).toEqual(snapshot);
  });

  it('returns a minimal object schema for non-object input', () => {
    expect(sanitizeGeminiSchema(null)).toEqual({ type: 'object', properties: {} });
    expect(sanitizeGeminiSchema(undefined)).toEqual({ type: 'object', properties: {} });
  });

  // Regression for FerroxLabs/wayland#24: no-argument MCP/builtin tools
  // (ijfw_run, ijfw_update_apply, execute) advertise `{ "type": "object" }` with
  // no `properties` key. Strict OpenAI-compatible endpoints (LM Studio) reject
  // that with HTTP 400. The root parameters object must always carry a
  // `properties` object so the serialized function schema is valid.
  it('adds an empty properties object to a bare {type:object} parameters schema', () => {
    const out = sanitizeGeminiSchema({ type: 'object' }) as Record<string, unknown>;
    expect(out.type).toBe('object');
    expect(out.properties).toEqual({});
  });

  it('adds type and properties to an empty parameters schema', () => {
    const out = sanitizeGeminiSchema({}) as Record<string, unknown>;
    expect(out.type).toBe('object');
    expect(out.properties).toEqual({});
  });

  it('leaves a populated properties object intact while still guaranteeing the key', () => {
    const out = sanitizeGeminiSchema({
      type: 'object',
      properties: { reason: { type: 'string' } },
    }) as { type: unknown; properties: Record<string, unknown> };
    expect(out.type).toBe('object');
    expect(out.properties).toEqual({ reason: { type: 'string' } });
  });

  // The root-level properties guarantee must NOT leak into nested subschemas:
  // a property literally named "properties" with no `properties` of its own must
  // stay as the recursion produced it (no bogus empty map injected).
  it('does not inject properties into a nested object subschema that lacks it', () => {
    const out = sanitizeGeminiSchema({
      type: 'object',
      properties: {
        config: { type: 'object', description: 'free-form config' },
      },
    }) as { properties: { config: Record<string, unknown> } };
    expect(out.properties.config).toEqual({ type: 'object', description: 'free-form config' });
    expect(out.properties.config).not.toHaveProperty('properties');
  });

  // Regression: a tool whose schema has a property literally named "properties"
  // (e.g. Notion's notion-create-pages) must NOT gain a bogus "type":"object"
  // property injected into the properties map. The naive "has properties → add
  // type:object" heuristic corrupts this into an invalid subschema → API 400.
  it('does not inject a bogus type into a properties map that contains a "properties" field', () => {
    const out = sanitizeGeminiSchema({
      type: 'object',
      properties: {
        pages: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              properties: { type: 'object', description: 'page props' },
              content: { type: 'string' },
              icon: { type: 'string' },
            },
          },
        },
      },
    }) as {
      properties: {
        pages: { items: { properties: Record<string, Record<string, unknown>> } & Record<string, unknown> } };
    };
    const itemProps = out.properties.pages.items.properties;
    expect(Object.keys(itemProps).sort()).toEqual(['content', 'icon', 'properties']);
    expect(itemProps).not.toHaveProperty('type');
    // additionalProperties stripped; the real subschemas survive intact.
    expect(out.properties.pages.items).not.toHaveProperty('additionalProperties');
    expect(out.properties.pages.items.type).toBe('object');
    expect(itemProps.properties.type).toBe('object');
  });

  it('preserves a property literally named "type" as a subschema (not the type keyword)', () => {
    const out = sanitizeGeminiSchema({
      type: 'object',
      properties: {
        type: { type: 'string', description: 'a field called type' },
      },
    }) as { properties: { type: Record<string, unknown> } };
    // The child "type" must remain its own subschema object, not be collapsed.
    expect(out.properties.type).toEqual({ type: 'string', description: 'a field called type' });
  });
});
