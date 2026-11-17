/**
 * Shared design tokens for the safari atlas map.
 *
 * These exist as JS constants rather than only as CSS custom properties
 * because several consumers need the *values* to do layout maths (the drawer
 * offset calculation) rather than merely to style themselves. CSS mirrors
 * these in :root so stylesheets and JS can never drift apart.
 */

/** Brand palette, matching tailwind.config.js. */
export const BRAND = {
  forest: '#1A362B', // cluster + boundary accents
  gold: '#C9A227',
  terracotta: '#C9683D',
  cream: '#FAF7F2',
  teal: '#2A5D5B',
};

/**
 * z-index tokens.
 *
 * The map shell sets `isolation: isolate`, which creates a stacking context.
 * Anything rendered inside it is therefore permanently trapped below any
 * element that is a sibling at body level, no matter how large a z-index it is
 * given. That is why the detail drawer is portaled to body instead of being
 * positioned inside the shell.
 *
 * Ordering contract (verify with the audit script if you change any value):
 *   40  sticky site header / sticky tour CTA
 *   50  WhatsApp floater, compare drawer, in-shell controls
 *   55  map detail drawer  <- above the widgets it must not be hidden by
 *   60  newsletter modal
 *   70  image lightbox
 */
export const Z = {
  sticky: 40,
  floatingWidget: 50,
  mapDrawer: 55,
  modal: 60,
  lightbox: 70,
};

/** Breakpoint below which the map controls collapse into a drawer. */
export const MOBILE_BREAKPOINT = 768;

/** Clustering only engages below this zoom; above it, every pin is shown. */
export const CLUSTER_MAX_ZOOM = 11;

/** Grid cell size in pixels used to bucket markers into clusters. */
export const CLUSTER_CELL = 64;