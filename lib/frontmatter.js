import YAML from 'yaml';

/** Split a markdown file into its header (between the --- lines) and its body. Works with Windows line endings. */
export function parseFrontmatter(src) {
  const text = String(src).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const m = text.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)([\s\S]*)$/);
  if (!m) return { data: {}, content: text };
  let data = {};
  try { data = YAML.parse(m[1]) || {}; } catch { data = {}; }
  return { data, content: m[2] };
}
