// Creates .env.local with a fresh random login if you do not have one yet.
//   npm run setup
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const file = path.join(process.cwd(), '.env.local');
if (fs.existsSync(file)) {
  console.log('.env.local already exists, nothing changed.');
  process.exit(0);
}
const words = ['loom', 'ember', 'indigo', 'thread', 'saffron', 'river', 'granite', 'monsoon', 'lantern', 'velvet', 'harbor', 'cedar', 'marigold', 'copper', 'meadow', 'falcon'];
const pick = () => words[crypto.randomInt(words.length)];
const password = `${pick()}-${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;
fs.writeFileSync(
  file,
  `ADMIN_PASSWORD=${password}\nSESSION_SECRET=${crypto.randomBytes(32).toString('hex')}\nNEXT_PUBLIC_PORTFOLIO_URL=\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\n`
);
console.log('\nCreated .env.local');
console.log('Your Studio password is:  ' + password);
console.log('Keep it private. Never upload .env.local anywhere.\n');
