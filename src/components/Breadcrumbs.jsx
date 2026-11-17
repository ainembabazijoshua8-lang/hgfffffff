import { Link, useLocation } from 'react-router-dom';
import { JsonLdScript } from '../utils/jsonLd.jsx';

const ROUTE_LABELS = {
  '/': 'Home',
  '/tours': 'Tours',
  '/booking': 'Safari Guide',
  '/activities': 'Activities',
  '/gallery': 'Gallery',
  '/about': 'About',
  '/blog': 'Journal',
  '/faq': 'FAQ',
  '/contact': 'Contact',
};

export default function Breadcrumbs({ items }) {
  const location = useLocation();

  // Auto-generate from path if no custom items provided
  const crumbs = items || (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const result = [{ label: 'Home', to: '/' }];
    let path = '';
    for (const part of parts) {
      path += `/${part}`;
      const label = ROUTE_LABELS[path] || decodeURIComponent(part).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      result.push({ label, to: path });
    }
    return result;
  })();

  if (crumbs.length <= 1) return null;

  // JSON-LD BreadcrumbList schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: crumb.to ? `https://jebrisafaris.com${crumb.to}` : undefined,
    })),
  };

  return (
    <>
      {/* Reuses the shared structured-data helper rather than emitting its own
          <script> tag, so every JSON-LD block on the site is emitted the same way. */}
      <JsonLdScript data={jsonLd} />
      {/* NO dark: variants here, deliberately. Tailwind v3 defaults darkMode to
          'media', so a `dark:` class activates purely on the visitor's
          prefers-color-scheme — no site-wide dark theme required. This trail
          renders inline on the light page canvas (linen #FAF7F2 / cream
          #F5F0E6), NOT inside a dark surface, so flipping its text to cream
          produced white-on-white: the current-page crumb measured 1.07:1 and
          the nav label 1.04:1 — invisible, for every dark-mode OS visitor.
          The NewsletterModal can carry dark: variants because it is a portaled
          overlay that flips its own background. Anything inline on the light
          canvas must not. Remove these only when a real dark theme lands. */}
      <nav aria-label="Breadcrumb" className="text-xs text-teal-600 mb-4">
        <ol className="flex flex-wrap items-center gap-1.5">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={crumb.to || i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-savanna-300" aria-hidden="true">›</span>}
                {isLast ? (
                  <span className="font-medium text-teal-800 truncate max-w-[200px]">{crumb.label}</span>
                ) : (
                  <Link to={crumb.to} className="hover:text-terracotta-500 transition truncate max-w-[150px]">
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
