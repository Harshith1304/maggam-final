import '@fontsource-variable/bricolage-grotesque/wdth.css';
import '@fontsource-variable/literata/index.css';
import '@fontsource-variable/noto-serif-telugu/index.css';
import '@fontsource/mrs-saint-delafield/index.css';
import './globals.css';

import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import LoomBackground from '@/components/LoomBackground';
import { ConfirmProvider } from '@/components/Confirm';
import ScrollThread from '@/components/ScrollThread';
import ScrollTopOnHome from '@/components/ScrollTopOnHome';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Maggam | thoughts woven daily', template: '%s | Maggam' },
  description: 'Short writings on discipline, people, solitude and the roads between, woven one thread a day by Harshith.',
  icons: { icon: '/favicon.svg' },
  openGraph: { title: 'Maggam | thoughts woven daily', description: 'One thread a day. Writing by Harshith.', type: 'website' },
};

export const viewport = { themeColor: '#0A0F2B' };

// Runs before first paint so there is never a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('maggam-theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;

// Browser extensions (wallets, translators...) sometimes throw errors inside our page. They are not ours,
// so they are kept out of the error overlay. Errors from the site's own code are never touched.
const extensionGuard = `(function(){function mine(x){var s=(x&&(x.stack||x.message))||String(x||'');return /(chrome|moz|safari-web)-extension:\/\//.test(s)}window.addEventListener('unhandledrejection',function(e){if(mine(e.reason)){e.preventDefault();e.stopImmediatePropagation()}},true);window.addEventListener('error',function(e){if(mine(e.error)||/-extension:\/\//.test(e.filename||'')){e.preventDefault();e.stopImmediatePropagation()}},true)})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript + extensionGuard }} />
      </head>
      <body>
        <ConfirmProvider>
          <LoomBackground />
          <ScrollThread />
          <ScrollTopOnHome />
          <a className="skip" href="#main">Skip to the writing</a>
          <div className="shell">
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
          </div>
        </ConfirmProvider>
      </body>
    </html>
  );
}
