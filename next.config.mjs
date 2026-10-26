/** @type {import('next').NextConfig} */
// Runs as a small Node server: on your own computer or server (files), or on Vercel (database).
export default {
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false, // hides the round "N" badge shown by `npm run dev` (it never exists in a live build)
  // On Vercel the threads that ship with the site are copied into the database on first start,
  // so the folder has to travel with the server code.
  outputFileTracingIncludes: { '/*': ['./content/threads/**/*'] },
};
