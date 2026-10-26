# Maggam | thoughts woven daily

A personal writing site by Harshith. Next.js, three.js, plain CSS.

- **Visitors** can read, leave comments, reply and like comments. They cannot write or change anything.
- **You** have a private **Studio**: notifications, comment moderation, a composer for new threads, and your own themes.

## Two ways to run it (same site, same look)

| Where | Where data is kept | Cost |
|---|---|---|
| **Your computer / your own server** | Plain files (`content/threads`, `data/`) | Free on your computer |
| **Vercel (free "Hobby" plan)** | A free Upstash Redis database from Vercel's marketplace | Free |

The site picks the right one by itself: on Vercel (with the database connected) it uses the database; everywhere else it uses files. Nothing about the design, pages or Studio changes between the two.

## First time in a new folder (Windows, PowerShell or cmd)

Install once:

    npm install

Bring your work across from the old folder (threads including new ones, comments, uploaded photos and your private login):

    npm run carry -- "C:\path\to\your\old\maggam"

No old folder? Create a fresh private login instead (it prints your password once):

    npm run setup

## Running it on your computer

While you are building and writing (first page loads are slower, see below):

    npm run dev

The real, fast version, exactly how it behaves when live (builds once, then serves):

    npm run live

Then open http://localhost:3000. The Studio is at /admin/login.

### Why `npm run dev` feels slow, and `npm run live` does not

`dev` compiles each page the first time you open it, watches your files, and keeps extra checking on. A live site never does that. `npm run live` shows the real performance. On Windows, keeping the project outside `Downloads` (for example `C:\dev\maggam`) also makes `npm install` and `npm run dev` quicker.

### Messages you may see

- `Failed to connect to MetaMask`: comes from the MetaMask browser extension, not this site. It is kept out of the error overlay.
- `Turbopack ... waiting for the filesystem to settle`: normal right after `npm install` on Windows. It stops on its own.
- The round `N` badge belongs to `npm run dev` only and is switched off.
- `npm audit` reports 0 vulnerabilities. Do not run `npm audit fix --force`.

## All commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm run live` | Build, then serve (the real, fast version) |
| `npm run build` / `npm start` | Build / serve separately |
| `npm run setup` | Creates `.env.local` with a random login |
| `npm run carry -- "<old folder>"` | Copies threads, data and login from an older folder |
| `npm run push` | Copies this computer's threads, themes, comments and photos UP to the Vercel database |
| `npm run pull` | Downloads everything from the Vercel database to this computer (a backup) |
| `npm run new -- "Title"` | Creates a markdown template for a new thread |

`push` and `pull` both accept `--dry` to show what they would do without changing anything.

## Putting it live on Vercel (free)

You need a GitHub account and a Vercel account (sign up with GitHub). Vercel's free Hobby plan is for personal, non-commercial use.

**1. Get your latest work into this folder.** Run `npm run carry -- "<old folder>"` (see above), then check the site on your computer with `npm run live`.

**2. Put the code on GitHub** (use Git, not drag-and-drop, so your private files stay private):

    git init
    git add .
    git status

Check that `.env.local` and `data` are NOT in the list. Then:

    git commit -m "Maggam"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/maggam.git
    git push -u origin main

Your threads in `content/threads` go with it. On the first start, the live site copies them into its database by itself.

**3. Create the Vercel project.** On vercel.com choose Add New, then Project, import the `maggam` repository, and leave the settings as detected (Next.js). Before deploying, open Environment Variables and add:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | A NEW strong password for the live Studio |
| `SESSION_SECRET` | Any random text of 32+ characters |
| `NEXT_PUBLIC_SITE_URL` | Your site address (you can update it later) |
| `NEXT_PUBLIC_PORTFOLIO_URL` | Optional: your portfolio link |

**4. Add the free database.** In the project, open Storage (or the Marketplace), choose Upstash, create a free Redis database, pick a region near you (and near the region your Vercel functions run in), and connect it to the project. Vercel adds the database's address and token to your Environment Variables automatically.

**5. Deploy** (or redeploy if you added the variables after the first deploy). Open the site: your threads are there. Sign in at `/admin/login` with the new password.

**6. Copy your comments, themes and photos up.** In your Vercel project, open the database and copy its REST address and token. Add them to your local `.env.local` as:

    UPSTASH_REDIS_REST_URL=...
    UPSTASH_REDIS_REST_TOKEN=...

(If Vercel names them `KV_REST_API_URL` and `KV_REST_API_TOKEN`, those work too.) Then run:

    npm run push -- --dry

to see what will be copied, and

    npm run push

to copy it. It is safe to run again: nothing is added twice, and threads that already exist online are kept as they are unless you add `--overwrite-threads`. Your local site keeps using files; these two values are only used by `push` and `pull`.

**7. Back up now and then.**

    npm run pull

downloads everything from the live database into this folder (older local copies are kept as `.bak-` files, nothing is deleted).

### Good to know on Vercel

- After you publish or edit in the Studio, visitors see the change within about 10 seconds.
- Photos are limited to 4 MB on Vercel (the Studio shrinks large photos automatically before uploading).
- The free database has monthly limits (about 500,000 commands and 256 MB at the time of writing). Normal reading costs very little because pages are cached for a few seconds. If the database is ever unreachable, visitors still see the last threads they loaded or the threads that shipped with the site, and the Studio shows a polite message.
- Free databases can pause after a long time without use; the first request afterwards may be slower.

### If something does not save on Vercel

Open `https://YOUR-SITE.vercel.app/api/status/`. It answers with one line:

- `"storage":"database"`: all good. The Studio, comments, themes and photos save to the database.
- `"storage":"files","missingDatabase":true`: the database is not connected to this project yet (or the site was not redeployed after connecting it). Reading works, but saving cannot, and the Studio shows a red notice. Fix: in Vercel open the project, go to Storage, connect an Upstash Redis database for Production, then Deployments, the three dots on the latest one, and Redeploy.

Vercel may name the database variables with its own prefix (for example `STORAGE_REST_API_URL`). Any pair ending in `_REST_API_URL` and `_REST_API_TOKEN` is accepted, so no renaming is needed. Never copy the read-only token.

## The Studio (owner only)

1. Go to `/admin/login` and enter your password.
2. After signing in, a **Studio** button appears in the header, with a badge for unread comments. Visitors never see it.
3. **Notifications**: every new comment and reply with its thread. Open and reply, mark read, or delete.
4. **Write a new thread** opens the composer, laid out like a finished thread:
   - **date**: picked in the site's own calendar. Days with a thread are marked woven and cannot be chosen, future days are locked, nothing before September 2026
   - **theme**: the four built-in themes are fixed; add your own (below)
   - **cover picture**: **Change picture** any time, from 30 illustrations or **My photos > Upload from my files**; **Adjust** to zoom and reposition
   - **text size**: a base size, plus a size for every paragraph (A− / A / A+ / A++)
   - Enter starts a new paragraph; start a line with "- " for a list
   - one or two **closing lines**; each becomes a downloadable PNG card
   - **Preview**, then **Publish thread**
5. Publishing lights a new square in the ledger and raises the thread count.
6. **Your threads** lists every thread with an **Edit** button; an edited thread keeps its address and comments.

## Your own themes (dyes)

The four built-in themes (Discipline, People, Self, Roots & Roads) are fixed. Add your own with **+ New theme** in the composer, or **Your themes > New theme** in the Studio: name it, pick a colour (24 quick colours, three sliders, or a colour code), and check the preview. Its button gets a dot like the built-in ones, and covers, cards and tiles take its colour. Edit or remove your themes any time; removing one asks which built-in theme to move its threads to. Up to 20 custom themes. Text colour is chosen automatically so it is always easy to read.

## Keeping your password private

Your login lives only in `.env.local` on your computer (and in the Environment Variables page of your host).

1. `.env.local` is listed in `.gitignore`, so Git never uploads it. Upload with Git, not by dragging a folder onto the GitHub website (which ignores `.gitignore`).
2. Before the first upload run `git add .` then `git status` and check `.env.local` is NOT listed.
3. On Vercel or any host, type the values into the host's settings. Never upload the file.
4. Use a new password for the live site.
5. If a password ever reaches GitHub, change it everywhere at once; deleting the file later does not remove it from the history.

## Your own server instead (optional)

The same code also runs on a server with a persistent disk (a VPS or AWS EC2): install Node 20.9+, clone the repo, create `.env.local`, then `npm install`, `npm run build`, `npm start`; keep it running with pm2 and serve it over HTTPS (nginx plus Let's Encrypt, forwarding the `Host` header and allowing uploads of at least 10 MB). Back up `content/` and `data/`.

## Security notes

- There is no SQL, so SQL injection does not apply. Login is rate-limited (also across Vercel's server instances), compares the password in constant time, and sets a signed httpOnly cookie that lasts 14 days. Without it, `/admin` redirects to the login page and every `/api/admin` call answers 401.
- Every owner action is re-checked on the server.
- Uploads are accepted only from you, only as PNG, JPG, WebP or GIF (checked by the file's real contents, never SVG).
- Comments are plain text, limited in length and frequency, with a hidden spam trap. The name "Harshith" is reserved.
- The four built-in themes cannot be changed through any route.

## Where things live

- `content/threads/*.md`  your writing (files mode), and the starting set for a new database
- `data/`                 comments, themes and uploads (files mode)
- `lib/remote-core.js`    the database client shared by the site and the push/pull tools
- `lib/backend.js`        decides files or database, and keeps the short-lived cache
- `lib/art.js`            the 30 vector illustrations (served as cached pictures at /art/)
- `lib/dyes.js`           built-in dyes and the colour engine for your own
- `components/`           interface pieces (ledger, composer, theme dialog, comments, 3D background, scroll thread)
- `scripts/`              setup, carry, push, pull, new-thread
- `proxy.js`              first gate in front of /admin
