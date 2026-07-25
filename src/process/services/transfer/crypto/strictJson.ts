/**
 * JSON.parse accepts duplicate object keys and silently keeps the last value.
 * Security-sensitive envelopes must reject that ambiguity before parsing.
 */
export function parseStrictJson(input: string): unknown {
  return new StrictJsonParser(input).parse();
}

class StrictJsonParser {
  private offset = 0;

  constructor(private readonly input: string) {}

  parse(): unknown {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.offset !== this.input.length) this.fail('trailing content');
    return value;
  }

  private parseValue(): unknown {
    const char = this.input[this.offset];
    if (char === '{') return this.parseObject();
    if (char === '[') return this.parseArray();
    if (char === '"') return this.parseString();
    if (char === 't') return this.parseLiteral('true', true);
    if (char === 'f') return this.parseLiteral('false', false);
    if (char === 'n') return this.parseLiteral('null', null);
    if (char === '-' || (char >= '0' && char <= '9')) return this.parseNumber();
    this.fail('invalid value');
  }

  private parseObject(): Record<string, unknown> {
    this.offset += 1;
    const result: Record<string, unknown> = Object.create(null);
    const keys = new Set<string>();
    this.skipWhitespace();
    if (this.consume('}')) return result;

    while (true) {
      this.skipWhitespace();
      if (this.input[this.offset] !== '"') this.fail('object key must be a string');
      const key = this.parseString();
      if (keys.has(key)) this.fail(`duplicate object key ${JSON.stringify(key)}`);
      keys.add(key);
      this.skipWhitespace();
      if (!this.consume(':')) this.fail('expected colon');
      this.skipWhitespace();
      result[key] = this.parseValue();
      this.skipWhitespace();
      if (this.consume('}')) return result;
      if (!this.consume(',')) this.fail('expected comma or closing brace');
    }
  }

  private parseArray(): unknown[] {
    this.offset += 1;
    const result: unknown[] = [];
    this.skipWhitespace();
    if (this.consume(']')) return result;

    while (true) {
      this.skipWhitespace();
      result.push(this.parseValue());
      this.skipWhitespace();
      if (this.consume(']')) return result;
      if (!this.consume(',')) this.fail('expected comma or closing bracket');
    }
  }

  private parseString(): string {
    const start = this.offset;
    this.offset += 1;
    while (this.offset < this.input.length) {
      const char = this.input[this.offset];
      if (char === '"') {
        this.offset += 1;
        try {
          return JSON.parse(this.input.slice(start, this.offset)) as string;
        } catch {
          this.fail('malformed string');
        }
      }
      if (char === '\\') {
        this.offset += 2;
        continue;
      }
      if (char.charCodeAt(0) < 0x20) this.fail('unescaped control character');
      this.offset += 1;
    }
    this.fail('unterminated string');
  }

  private parseNumber(): number {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(this.input.slice(this.offset));
    if (!match) this.fail('malformed number');
    this.offset += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) this.fail('non-finite number');
    return value;
  }

  private parseLiteral<T>(literal: string, value: T): T {
    if (!this.input.startsWith(literal, this.offset)) this.fail('malformed literal');
    this.offset += literal.length;
    return value;
  }

  private skipWhitespace(): void {
    while (' \t\r\n'.includes(this.input[this.offset] ?? '\u0000')) this.offset += 1;
  }

  private consume(expected: string): boolean {
    if (this.input[this.offset] !== expected) return false;
    this.offset += 1;
    return true;
  }

  private fail(message: string): never {
    throw new Error(`Invalid transfer envelope JSON at byte ${this.offset}: ${message}`);
  }
}
