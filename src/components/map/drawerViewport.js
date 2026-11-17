import { useEffect, useState } from 'react';
import { Z, MOBILE_BREAKPOINT } from './tokens.js';

/**
 * Drawer ↔ floating-widget coordination.
 *
 * The problem: WhatsAppFloater (z-50) and the sticky tour CTA (z-40) are body
 * level, so they paint over any map overlay. A drawer rendered inside
 * .safari-map-shell can never beat them (isolation: isolate traps it), and a
 * portaled drawer at z-55 would sit *over* the WhatsApp button, which is also
 * wrong — the button should remain reachable.
 *
 * Solution: publish drawer state onto <body> as data attributes plus CSS custom
 * properties, and let CSS shift the floating widgets. One source of truth, no
 * prop-drilling through unrelated page components, and the widgets keep their
 * own z-index.
 */

/**
 * SSR-safe media query hook.
 *
 * window.matchMedia does not exist under Node, and the initial state is read
 * during render — so an unguarded call throws during SSR and takes the whole
 * map down, not just this hook. JSDOM and headless shells also omit it, so the
 * feature test below is not paranoia.
 */
export function useMediaQuery(query) {
  const supportsMatchMedia =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function';

  const [matches, setMatches] = useState(() =>
    supportsMatchMedia ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (!supportsMatchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = e => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [query, supportsMatchMedia]);

  return matches;
}

export const useIsMobile = () => useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

/**
 * Read a length token published by index.css so the JS side never restates a
 * number that CSS also owns.
 *
 * The side-panel width used to be hardcoded as `reserveRight: 360` here AND as
 * `min(360px, ...)` in index.css. The two are wired together -- the reserved
 * width is what shifts the WhatsApp floater out from under the open drawer --
 * so changing only the CSS would silently leave the floater at the old offset,
 * sitting underneath the panel. Reading the token keeps one source of truth.
 * Falls back to the previous literal if CSS has not loaded yet.
 */
const FALLBACK_DRAWER_WIDTH = 360;

export function readCssLength(name, fallback) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Read a viewport-relative token ("58vh") as a 0–1 fraction.
 *
 * Kept separate from readCssLength because a bare parseFloat turns "58vh" into
 * 58, which is only correct by coincidence when the caller divides by 100.
 * Treating the unit explicitly means a later change to px or % cannot silently
 * produce a 100x wrong offset.
 */
export function readViewportFraction(name, fallback) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const match = /^(-?[\d.]+)\s*(vh|vw|%)?$/.exec(raw);
  if (!match) return fallback;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value)) return fallback;
  // vh/vw are viewport units: 58vh === 0.58. % is already a fraction.
  return match[2] === '%' ? value / 100 : value / 100;
}

/**
 * Compute how far the floating widgets must move to clear an open drawer.
 *
 * On mobile the drawer is a bottom sheet, so widgets shift up by the sheet
 * height. On desktop the drawer is a side panel on the right, so vertical shift
 * is unnecessary — only the width reservation matters, which is handled in CSS.
 */
export function computeDrawerLayout({ isMobile, drawerOpen, drawerHeight, shellHeight }) {
  if (!drawerOpen) {
    return { offset: 0, mode: 'closed', reserveRight: 0 };
  }
  if (isMobile) {
    return {
      offset: Math.min(drawerHeight, shellHeight ?? drawerHeight),
      mode: 'sheet',
      reserveRight: 0,
    };
  }
  return {
    offset: 0,
    mode: 'side-panel',
    reserveRight: readCssLength('--map-drawer-width', FALLBACK_DRAWER_WIDTH),
  };
}

/**
 * Applies the computed layout to <body> so global CSS can react.
 * Returns the values as well, for components that need them in JS.
 */
export function useDrawerViewportSync(layout) {
  const { offset, mode, reserveRight } = layout;

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.style.setProperty('--map-drawer-z', String(Z.mapDrawer));
    root.style.setProperty('--map-drawer-offset', `${offset}px`);
    root.style.setProperty('--map-drawer-reserve', `${reserveRight}px`);
    body.dataset.mapDrawer = offset > 0 ? 'open' : mode === 'side-panel' ? 'open' : 'closed';
    body.dataset.mapDrawerMode = mode;

    return () => {
      delete body.dataset.mapDrawer;
      delete body.dataset.mapDrawerMode;
      root.style.removeProperty('--map-drawer-offset');
      root.style.removeProperty('--map-drawer-reserve');
    };
  }, [offset, mode, reserveRight]);
}