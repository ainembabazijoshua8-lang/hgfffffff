// Line icons that replace emoji across the site. Each icon is a list of SVG
// shapes on a 24px grid with a 2px round stroke, so the set reads as one family.
// They size to the surrounding font (1em) and take the text colour.
//
// Data files refer to icons by name (e.g. iconType: 'paw'); <SiteIcon name>
// renders them in React, and iconMarkup() returns the same SVG as a string for
// places that need raw HTML, such as MapLibre marker elements.

const WHATSAPP_PATH = 'M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z';

const p = d => ['path', { d }];
const c = (cx, cy, r) => ['circle', { cx, cy, r }];
const rect = (x, y, width, height, rx = 0) => ['rect', { x, y, width, height, rx }];

const CALENDAR = [rect(3, 5, 18, 16, 2), p('M3 10h18M8 3v4M16 3v4')];
const HORIZON_SUN = 'M3 18h18M7 18a5 5 0 0 1 10 0M4.5 12.5l1.4 1M19.5 12.5l-1.4 1M8 21h8';

/** name -> { nodes, filled? } */
export const ICON_NODES = {
  // Navigation and UI
  search: { nodes: [c(11, 11, 7), p('m20 20-4-4')] },
  close: { nodes: [p('M6 6l12 12M18 6 6 18')] },
  check: { nodes: [p('M5 12.5 10 17l9-10')] },
  'arrow-right': { nodes: [p('M5 12h14M13 6l6 6-6 6')] },
  info: { nodes: [c(12, 12, 9), p('M12 11v6M12 7.5h.01')] },
  alert: { nodes: [p('M12 3 2 20h20zM12 9v5M12 17h.01')] },
  reset: { nodes: [p('M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5')] },
  layers: { nodes: [p('M12 3 2 8l10 5 10-5zM2 12.5l10 5 10-5M2 17l10 5 10-5')] },
  lock: { nodes: [rect(4, 11, 16, 10, 2), p('M8 11V7a4 4 0 0 1 8 0v4')] },
  printer: { nodes: [p('M6 9V3h12v6M6 18H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-2'), rect(6, 14, 12, 7)] },
  'file-text': { nodes: [p('M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h6')] },
  clipboard: { nodes: [p('M9 3h6v3H9zM9 4.5H6V21h12V4.5h-3M9 11h6M9 15h6')] },
  notebook: { nodes: [rect(5, 3, 14, 18, 1), p('M9 3v18M12 8h4M12 12h4')] },
  book: { nodes: [p('M2 5h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 5h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z')] },
  scale: { nodes: [p('M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z')] },
  target: { nodes: [c(12, 12, 9), c(12, 12, 5), c(12, 12, 1)] },
  sparkles: { nodes: [p('M11 3l1.8 4.7 4.7 1.8-4.7 1.8L11 16l-1.8-4.7-4.7-1.8 4.7-1.8zM19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2-2.2-.8 2.2-.8z')] },
  lightbulb: { nodes: [p('M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1v1h5v-1c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z')] },
  star: { filled: true, nodes: [p('M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z')] },

  // Contact
  phone: { nodes: [p('M21 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.1 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z')] },
  mail: { nodes: [rect(3, 5, 18, 14, 2), p('M3 7l9 6 9-6')] },
  message: { nodes: [p('M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z')] },
  speech: { nodes: [p('M4 5h16v10H10l-5 4v-4H4z')] },
  smartphone: { nodes: [rect(7, 2, 10, 20, 2), p('M11 18h2')] },
  whatsapp: { filled: true, nodes: [p(WHATSAPP_PATH)] },

  // Time and weather
  calendar: { nodes: CALENDAR },
  'calendar-check': { nodes: [...CALENDAR, p('M9 15l2 2 4-4')] },
  clock: { nodes: [c(12, 12, 9), p('M12 7v5l3 2')] },
  sun: { nodes: [c(12, 12, 4), p('M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4')] },
  sunrise: { nodes: [p(`${HORIZON_SUN}M12 3v6M9.5 5.5 12 3l2.5 2.5`)] },
  sunset: { nodes: [p(`${HORIZON_SUN}M12 3v6M9.5 6.5 12 9l2.5-2.5`)] },
  moon: { nodes: [p('M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z')] },
  'cloud-rain': { nodes: [p('M17.5 15H7a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18 9a3 3 0 0 1-.5 6zM8 18v2M12 18v3M16 18v2')] },
  flame: { nodes: [p('M12 22c4 0 7-2.7 7-6.5 0-3.5-2.5-5.5-3.5-8.5-1 2-2 3-3.5 3.5C12.5 7 11 4 8.5 2 9 6 5 8.5 5 15.5 5 19.3 8 22 12 22z')] },
  bolt: { nodes: [p('M13 2 4 14h7l-1 8 9-12h-7z')] },

  // Places and travel
  'map-pin': { nodes: [p('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z'), c(12, 9.5, 2.5)] },
  map: { nodes: [p('M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20')] },
  compass: { nodes: [c(12, 12, 9), p('M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z')] },
  globe: { nodes: [c(12, 12, 9), p('M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18')] },
  satellite: { nodes: [p('M10 10l4 4-2.5 2.5-4-4zM5.5 5.5 9 9l-2 2-3.5-3.5zM15 15l3.5 3.5-2 2L13 17zM16 4a4 4 0 0 1 4 4M16 7a1 1 0 0 1 1 1')] },
  mountain: { nodes: [p('M3 20 9.5 8l4 6.5L16 11l5 9zM7.7 11.4 9.5 13l1.6-1.4')] },
  tree: { nodes: [p('M12 22v-6M12 16c-4 0-7-2.5-7-6a5 5 0 0 1 3-4.6 4 4 0 0 1 8 0 5 5 0 0 1 3 4.6c0 3.5-3 6-7 6z')] },
  palm: { nodes: [p('M12 21c0-5 .5-9 2-12M14 9c-1-3-4-4-7-3 2 0 4 1 5 3M14 9c1-3 4-4 7-3-2 0-4 1-5 3M14 9c-3-1-6 0-8 3M14 9c3-1 6 0 7 3M8 21h10')] },
  leaf: { nodes: [p('M4 20c1-8 6-14 16-15-1 10-7 15-15 15zM4 20 13 11')] },
  waves: { nodes: [p('M3 8c2 0 2-1.5 4.5-1.5S10 8 12 8s2-1.5 4.5-1.5S19 8 21 8M3 13c2 0 2-1.5 4.5-1.5S10 13 12 13s2-1.5 4.5-1.5S19 13 21 13M3 18c2 0 2-1.5 4.5-1.5S10 18 12 18s2-1.5 4.5-1.5S19 18 21 18')] },
  house: { nodes: [p('M3 11 12 4l9 7M5 9.5V20h14V9.5M10 20v-5h4v5')] },
  landmark: { nodes: [p('M6 12a6 6 0 0 1 12 0M12 3v3M4 12h16v9H4zM10 21v-4a2 2 0 0 1 4 0v4')] },
  tent: { nodes: [p('M3 20 12 4l9 16zM9 20l3-6 3 6M2 20h20')] },
  plane: { nodes: [p('M21 15.5v-2l-8-5V4a1.5 1.5 0 0 0-3 0v4.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-4.5z')] },
  car: { nodes: [p('M2.5 16v-5l2.5-4h10.5l3.5 4h2.5v5h-1.5M5 16H2.5M9.5 16h5M2.5 11h19M10 7v4'), c(7.25, 16.25, 2.25), c(16.75, 16.25, 2.25)] },
  sailboat: { nodes: [p('M12 3v14M12 5 5 16h7M12 8l6 8h-6M3 20c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0')] },
  balloon: { nodes: [p('M12 16c-3.5-1.5-6-4.5-6-8a6 6 0 0 1 12 0c0 3.5-2.5 6.5-6 8zM12 2c-1.7 2-2.5 4-2.5 6s.8 5 2.5 8M12 2c1.7 2 2.5 4 2.5 6s-.8 5-2.5 8M10 16.5l.5 2.5h3l.5-2.5M10.5 19h3v2.5h-3z')] },
  footprints: { nodes: [p('M7 3c1.5 0 2.5 2 2.5 4.5S8.5 12 7 12s-2.5-2-2.5-4.5S5.5 3 7 3zM5 15h4v2a2 2 0 0 1-4 0zM17 7c1.5 0 2.5 2 2.5 4.5S18.5 16 17 16s-2.5-2-2.5-4.5S15.5 7 17 7zM15 19h4v.5a2 2 0 0 1-4 0z')] },
  passport: { nodes: [p('M14 3H6v18h12V7zM14 3v4h4M9 14l2 2 4-4')] },

  // Wildlife
  paw: { nodes: [c(6, 11, 1.7), c(9.5, 6.5, 1.7), c(14.5, 6.5, 1.7), c(18, 11, 1.7), p('M8 17c0-2.6 1.9-5 4-5s4 2.4 4 5c0 1.6-1.2 2.5-2.5 2.5-.9 0-1-.6-1.5-.6s-.6.6-1.5.6C9.2 19.5 8 18.6 8 17z')] },
  bird: { nodes: [p('M4 15c2.5 0 4-1 5.5-3L12 8a3.5 3.5 0 0 1 6.5 1.5V11c0 4-3.5 7-8 7H4zM18.5 9.5 21 10l-2.5 1M15.5 8.5h.01M10 18v3M13 18v3')] },
  fish: { nodes: [p('M6.5 12c2.5-3.5 6-5 9-5 2.5 0 4.5 2 5.5 5-1 3-3 5-5.5 5-3 0-6.5-1.5-9-5zM6.5 12 2 8v8zM16.5 10.5h.01')] },
  turtle: { nodes: [p('M4 15a8 7 0 0 1 16 0zM20 15h1.5a1.5 1.5 0 0 0 0-3H19M6.5 15l-1 3M17.5 15l1 3M9 9l1.5 3h3L15 9M10.5 12 9 15M13.5 12l1.5 3')] },
  binoculars: { nodes: [c(6.5, 16, 3.5), c(17.5, 16, 3.5), p('M3.5 14 6 6h3.5l.5 8M20.5 14 18 6h-3.5l-.5 8M10 15.5h4')] },
  egg: { nodes: [p('M12 3c3.5 0 6.5 5 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8 8.5 3 12 3z')] },

  // People
  user: { nodes: [c(12, 8, 4), p('M4 21a8 8 0 0 1 16 0')] },
  users: { nodes: [c(9, 8, 3.5), p('M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2a6.5 6.5 0 0 1 3.5 5.8')] },
  baby: { nodes: [c(12, 8, 4.5), p('M10.3 8h.01M13.7 8h.01M10.8 10a1.8 1.8 0 0 0 2.4 0M7 21v-1.5a5 5 0 0 1 10 0V21')] },
  heart: { nodes: [p('M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z')] },
  gem: { nodes: [p('M6 3h12l3 6-9 12L3 9zM3 9h18M12 21 9 9l3-6 3 6z')] },
  eye: { nodes: [p('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z'), c(12, 12, 3)] },
  mute: { nodes: [p('M11 5 6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6')] },
  shield: { nodes: [p('M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z')] },
  'shield-check': { nodes: [p('M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-5')] },

  // Gear and comforts
  camera: { nodes: [p('M3 8h4l2-3h6l2 3h4v11H3z'), c(12, 13, 3.5)] },
  backpack: { nodes: [p('M6 9a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v12H6zM9 5V3h6v2M9 13h6v4H9z')] },
  shirt: { nodes: [p('M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z')] },
  pill: { nodes: [p('M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 10l7 7')] },
  bag: { nodes: [p('M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2')] },
  battery: { nodes: [rect(2, 7, 17, 10, 2), p('M21 11v2M11 9l-2 3h4l-2 3')] },
  save: { nodes: [p('M5 3h11l4 4v14H5zM8 3v5h7V3M8 21v-7h8v7')] },
  brush: { nodes: [p('M14 4l6 6-7 7-6-6zM7 11l-4 7 7-4')] },
  bean: { nodes: [p('M8 4c-3.5 1.5-5 6-3 10s7 6.5 10.5 5.5 5-5 2.5-7.5c-2-2-4.5-1.5-5.5-4S11 2.7 8 4z')] },
  utensils: { nodes: [p('M7 3v8a2 2 0 0 1-2 2v8M5 3v6M9 3v6M17 21V3c-2 1-3 4-3 8h3')] },
  flower: { nodes: [p('M12 20c-4 0-8-3-9-7 3 0 6 1 9 4 3-3 6-4 9-4-1 4-5 7-9 7zM12 17c-2-2-2.5-6 0-11 2.5 5 2 9 0 11z')] },
  drum: { nodes: [p('M3 8c0-1.7 4-3 9-3s9 1.3 9 3-4 3-9 3-9-1.3-9-3zM3 8v8c0 1.7 4 3 9 3s9-1.3 9-3V8M7 10.5v8M17 10.5v8')] },
  seat: { nodes: [p('M8 3h5a2 2 0 0 1 2 2v9H8zM5 14h13v3H5zM7 17v4M16 17v4')] },
  roof: { nodes: [p('M3 19h18M4 19v-7h16v7M7 12V8h10v4M4 5h16')] },
  fridge: { nodes: [rect(6, 2, 12, 20, 2), p('M6 10h12M9 5v2M9 13v3')] },
  radio: { nodes: [rect(4, 9, 16, 11, 2), p('M8 9l9-5M8 13h.01M8 16h.01'), c(15, 14.5, 2.5)] },
  wallet: { nodes: [p('M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3M16 13.5h.01')] },
};

const ATTR_NAMES = { strokeWidth: 'stroke-width' };

function renderNode([tag, attrs], key) {
  const Tag = tag;
  return <Tag key={key} {...attrs} />;
}

/** Renders a named icon. Unknown names fall back to `fallback` (default: info). */
export function SiteIcon({ name, className = '', strokeWidth = 2, fallback = 'info', title }) {
  const icon = ICON_NODES[name] || ICON_NODES[fallback];
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill={icon.filled ? 'currentColor' : 'none'}
      stroke={icon.filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
      className={`inline-block shrink-0 ${className}`}
    >
      {title ? <title>{title}</title> : null}
      {icon.nodes.map(renderNode)}
    </svg>
  );
}

const escapeAttr = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The same icon as an SVG string, for raw-HTML contexts (map marker elements). */
export function iconMarkup(name, { size = 16, color = 'currentColor', strokeWidth = 2, fallback = 'info' } = {}) {
  const icon = ICON_NODES[name] || ICON_NODES[fallback];
  const paint = icon.filled
    ? `fill="${escapeAttr(color)}" stroke="none"`
    : `fill="none" stroke="${escapeAttr(color)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;
  const body = icon.nodes
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${ATTR_NAMES[k] || k}="${escapeAttr(v)}"`).join(' ')}/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" ${paint} aria-hidden="true" focusable="false">${body}</svg>`;
}

// Named components kept for existing imports (Header, SiteSearch).
const named = name => {
  const Named = props => <SiteIcon name={name} {...props} />;
  Named.displayName = `Icon(${name})`;
  return Named;
};
export const SearchIcon = named('search');
export const CloseIcon = named('close');
export const CalendarIcon = named('calendar');
export const StarIcon = named('star');
export const PhoneIcon = named('phone');
export const ArrowRightIcon = named('arrow-right');
export const WhatsAppIcon = named('whatsapp');
