// Brings your work from an older Maggam folder into this one:
//   your threads (including new ones), comments, uploaded photos and your private .env.local
//
//   npm run carry -- "C:\path\to\old\maggam"
import fs from 'node:fs';
import path from 'node:path';

const from = process.argv[2] ? path.resolve(process.argv[2]) : null;
const here = process.cwd();

if (!from) { console.error('Tell me the old folder:  npm run carry -- "C:\\path\\to\\old\\maggam"'); process.exit(1); }
if (from === here) { console.error('That is this same folder. Give the path of the OLD one.'); process.exit(1); }
if (!fs.existsSync(path.join(from, 'content', 'threads'))) { console.error('I could not find content/threads inside: ' + from); process.exit(1); }

const copy = (rel, label) => {
  const src = path.join(from, rel), dest = path.join(here, rel);
  if (!fs.existsSync(src)) { console.log(`  - ${label}: nothing to copy`); return; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log(`  + ${label}: copied`);
};

console.log('\nCarrying your work over from:\n  ' + from + '\n');
const before = fs.readdirSync(path.join(here, 'content', 'threads')).filter((f) => f.endsWith('.md'));
copy(path.join('content', 'threads'), 'threads');
const after = fs.readdirSync(path.join(here, 'content', 'threads')).filter((f) => f.endsWith('.md'));
const added = after.filter((f) => !before.includes(f));
if (added.length) console.log('    new threads brought in: ' + added.join(', '));
copy('data', 'comments, likes and uploaded photos');
copy('.env.local', 'your private login (.env.local)');
console.log('\nDone. Start the site with:  npm run dev\n');
