import { describe, it, expect } from 'vitest';
import { parseFrontmatterForTest } from '@process/task/AcpSkillManager';

describe('parseFrontmatter', () => {
  it('parses a rich frontmatter with full metadata block', () => {
    const content = `---
name: my-skill
description: Does something useful
license: Apache-2.0
type: workflow
metadata:
  author: Jane Doe
  version: 1.2.3
  tags: productivity automation writing
  category: content
  subcategory: editing
  difficulty: intermediate
  model: claude-3-5-sonnet
  tools: web_search file_read
  depends: base-skill helper-skill
---

# Body content here
`;

    const result = parseFrontmatterForTest(content);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('my-skill');
    expect(result!.description).toBe('Does something useful');
    expect(result!.metadata).toMatchObject({
      author: 'Jane Doe',
      version: '1.2.3',
      tags: ['productivity', 'automation', 'writing'],
      category: 'content',
      subcategory: 'editing',
      difficulty: 'intermediate',
      model: 'claude-3-5-sonnet',
      tools: 'web_search file_read',
      depends: ['base-skill', 'helper-skill'],
    });
  });

  it('parses a legacy 2-field frontmatter (name + description only)', () => {
    const content = `---
name: simple-skill
description: A minimal skill
---

Body here.
`;

    const result = parseFrontmatterForTest(content);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('simple-skill');
    expect(result!.description).toBe('A minimal skill');
    expect(result!.metadata).toMatchObject({ tags: [] });
  });

  it('returns null for malformed frontmatter (no --- delimiters)', () => {
    const content = `name: broken
description: no delimiters

Body.
`;

    const result = parseFrontmatterForTest(content);
    expect(result).toBeNull();
  });

  it('returns null when name is empty string', () => {
    const content = `---
name:
description: Has no name
---

Body.
`;

    const result = parseFrontmatterForTest(content);
    expect(result).toBeNull();
  });

  it('returns null when name field is absent', () => {
    const content = `---
description: No name at all
---

Body.
`;

    const result = parseFrontmatterForTest(content);
    expect(result).toBeNull();
  });
});
