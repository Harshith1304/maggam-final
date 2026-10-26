// Usage (Windows, macOS, Linux):  npm run new -- "Title of today's thread"
import fs from 'node:fs';
import path from 'node:path';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Give the thread a title:  npm run new -- "Your title here"');
  process.exit(1);
}
const d = new Date();
const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const file = path.join(process.cwd(), 'content', 'threads', `${iso}-${slug}.md`);
if (fs.existsSync(file)) { console.error('Already exists:', file); process.exit(1); }

fs.writeFileSync(file, `---
title: ${JSON.stringify(title)}
date: ${iso}
# One of: Discipline, People, Self, Roots & Roads  (decides the dye colour)
category: "Discipline"
# One of: pack lens plains crossroads pitcher marsh scales wheel target sapling road climb hill orchard chariot diya mirror door seesaw bridge
motif: road
size: regular
quotes:
  - "Your closing line goes here"
---
Write the first paragraph here.

Leave a blank line between paragraphs.
`);
console.log('Created', path.relative(process.cwd(), file));
