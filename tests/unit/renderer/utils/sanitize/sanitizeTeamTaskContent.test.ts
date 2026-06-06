// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  sanitizeTeamTaskDescription,
  sanitizeTeamTaskTitle,
} from '@/renderer/utils/sanitize/sanitizeTeamTaskContent';

describe('sanitizeTeamTaskTitle', () => {
  it('strips all HTML tags from title', () => {
    expect(sanitizeTeamTaskTitle('<b>X</b>')).toBe('X');
    expect(sanitizeTeamTaskTitle('<script>alert(1)</script>')).toBe('');
  });
  it('preserves plain text', () => {
    expect(sanitizeTeamTaskTitle('Ship the launch')).toBe('Ship the launch');
  });
});

describe('sanitizeTeamTaskDescription', () => {
  it('strips <img> tags (SSRF tracker block)', () => {
    const out = sanitizeTeamTaskDescription('<p>hi <img src="http://evil/ping"></p>');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('evil');
  });

  it('strips <script> tags', () => {
    const out = sanitizeTeamTaskDescription('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert');
  });

  it('removes javascript: anchors', () => {
    const out = sanitizeTeamTaskDescription('<a href="javascript:alert(1)">x</a>');
    expect(out.toLowerCase()).not.toContain('javascript:');
  });

  it('rewrites https anchors with rel + target', () => {
    const out = sanitizeTeamTaskDescription('<a href="https://example.com">link</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });

  it('strips inline style attribute (SSRF block)', () => {
    const out = sanitizeTeamTaskDescription('<p style="background:url(http://evil)">x</p>');
    expect(out).not.toContain('style=');
    expect(out).not.toContain('evil');
  });

  it('strips data: anchor', () => {
    const out = sanitizeTeamTaskDescription('<a href="data:text/html,<script>x</script>">x</a>');
    expect(out).not.toContain('data:');
  });

  it('strips vbscript: anchor', () => {
    const out = sanitizeTeamTaskDescription('<a href="vbscript:msgbox()">x</a>');
    expect(out.toLowerCase()).not.toContain('vbscript:');
  });

  it('strips onerror attribute', () => {
    const out = sanitizeTeamTaskDescription('<p onerror="x">y</p>');
    expect(out).not.toContain('onerror');
  });

  it('preserves allowed markdown-compatible tags', () => {
    const out = sanitizeTeamTaskDescription('<p><strong>bold</strong> <em>italic</em></p>');
    expect(out).toContain('<strong>');
    expect(out).toContain('<em>');
  });

  it('preserves relative anchor with rel + target', () => {
    const out = sanitizeTeamTaskDescription('<a href="/team/x">jump</a>');
    expect(out).toContain('href="/team/x"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });
});
