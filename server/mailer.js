// server/mailer.js — sends inquiry emails and (optionally) customer confirmations
//
// Email routing policy:
//
//   jebrisafaris@gmail.com      = OFFICIAL business inbox.
//                                 Default destination for inquiries, booking
//                                 confirmations, and partner messages.
//   ainembabazijoshua8@gmail.com = Joshua Ainembabazi's PERSONAL co-founder
//                                 address. Always BCC'd on outgoing business
//                                 mail so he sees everything as co-founder #1.
//   mncblacs@gmail.com          = Lowasa Gibson's PERSONAL co-founder address.
//                                 Always BCC'd so he sees everything too.
//
// Configuration (all optional in dev — falls back to console transport if
// SMTP creds are not set):
//
//   MAIL_FROM          — from address (default: noreply@jebrisafaris.com)
//   MAIL_TO_BUSINESS   — primary business inbox (default: jebrisafaris@gmail.com)
//   MAIL_BCC_FOUNDERS  — comma-separated co-founder BCC list
//                        (default: ainembabazijoshua8@gmail.com,mncblacs@gmail.com)
//   MAIL_BCC           — optional extra BCC (e.g. partner inbox)
//   MAIL_HOST          — SMTP host (e.g. smtp.gmail.com)
//   MAIL_PORT          — SMTP port (default 587)
//   MAIL_USER          — SMTP username (= the inbox that AUTHs to SMTP)
//   MAIL_PASS          — SMTP password (Gmail: App Password)
//   MAIL_SECURE        — "true" for port 465
//
// If SMTP creds are absent, emails are pretty-printed to the server console —
// dev still works end-to-end, and production only needs env vars to flip into
// real delivery.

import 'dotenv/config';
import nodemailer from 'nodemailer';

const MAIL_FROM = process.env.MAIL_FROM || 'Jebri Safaris <jebrisafaris@gmail.com>';
// Official business inbox — destinations arrive here by default.
const MAIL_TO_BUSINESS = process.env.MAIL_TO_BUSINESS || 'jebrisafaris@gmail.com';
// Co-founders' personal inboxes — both BCC'd on every outgoing mail so
// nothing slips past either of them. Comma-separated list via env var.
const MAIL_BCC_FOUNDERS = (process.env.MAIL_BCC_FOUNDERS
  || 'ainembabazijoshua8@gmail.com,mncblacs@gmail.com')
  .split(',').map(s => s.trim()).filter(Boolean);
// Backward-compat: if someone set MAIL_BCC=... we keep it; otherwise it stays empty.
const MAIL_BCC_CUSTOM = process.env.MAIL_BCC || '';

let transporter = null;
let usingRealSmtp = false;
let smtpVerified = false;
let lastMailerError = '';
let lastSentAt = null;

function init() {
  if (transporter) return;
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.MAIL_PORT || 587),
      secure: String(process.env.MAIL_SECURE || 'false') === 'true',
      auth: { user, pass },
      connectionTimeout: Number(process.env.MAIL_CONNECTION_TIMEOUT_MS || 10000),
      greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT_MS || 10000),
      socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT_MS || 15000),
      // Defense-in-depth: block embedded file:// / http(s):// references in
      // message content. Mail body and html are built from escaped form data,
      // but turning these on guarantees an attacker can't smuggle a
      // data-exfiltration path through cid:/file: URIs even if some other bug
      // ever lets user content slip into the transport.
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    usingRealSmtp = true;
    console.log(`✓ Mailer: SMTP ${host} as ${user}`);
    transporter.verify()
      .then(() => {
        smtpVerified = true;
        console.log('✓ Mailer: SMTP connection verified');
      })
      .catch((error) => {
        lastMailerError = error.message;
        console.error('✗ Mailer: SMTP verification failed:', error.message);
      });
  } else {
    // Dev fallback — JSON stream transport (no network, no real delivery)
    transporter = nodemailer.createTransport({ jsonTransport: true });
    usingRealSmtp = false;
    console.log('⚠ Mailer: NO SMTP CREDS — running in console-only dev mode');
    console.log('  → Set MAIL_HOST, MAIL_USER, MAIL_PASS in .env to enable real email.');
    console.log('  → Business inbox (To):', MAIL_TO_BUSINESS);
    console.log('  → Co-founders (BCC)   :', MAIL_BCC_FOUNDERS.join(', '),
                MAIL_BCC_CUSTOM ? `(extra: ${MAIL_BCC_CUSTOM})` : '');
  }
}

init();

/**
 * Build the final BCC list. Both co-founders are always included unless the
 * user explicitly disabled them by setting MAIL_BCC_FOUNDERS="".
 */
function resolveBcc() {
  const list = [...MAIL_BCC_FOUNDERS];
  const customList = MAIL_BCC_CUSTOM.split(',').map(s => s.trim()).filter(Boolean);
  for (const email of customList) {
    if (!list.includes(email)) list.push(email);
  }
  return list.length ? list.join(',') : undefined;
}

/**
 * Send an inquiry email to the business inbox (with the co-founder BCC'd).
 * Returns { ok, info, error? } — never throws so the API stays 200 to the user.
 *
 * The customer is NEVER added to the `to:` field — they would see the business
 * address and get internal-only content. The customer's email is set as
 * `replyTo` so the founder can simply hit Reply.
 */
export async function sendInquiryEmail(inquiry) {
  try {
    const ref = inquiry.reference || 'JS-pending';
    const heading = inquiry.heading || 'New safari inquiry';
    const safeName = sanitizeHeaderValue(inquiry.name);
    const safeEmail = sanitizeHeaderValue(inquiry.email);
    const internalSubject = `${heading} [${ref}] — ${safeName || 'anonymous'}`;

    const html = renderInquiryEmail(inquiry);

    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO_BUSINESS,
      bcc: resolveBcc(),
      subject: internalSubject,
      html,
      replyTo: safeEmail || undefined,
    });

    if (!usingRealSmtp) {
      const bcc = resolveBcc() || '';
      console.log('\n========== EMAIL (DEV — not delivered) ==========');
      console.log('To:', MAIL_TO_BUSINESS, bcc ? `(bcc: ${bcc})` : '');
      console.log('ReplyTo:', safeEmail || '(none)');
      console.log('Subject:', internalSubject);
      console.log('Reference:', ref);
      console.log('From:', safeName || '?', '<' + (safeEmail || 'no-email') + '>');
      console.log('--- preview (first 600 chars) ---');
      console.log(html.replace(/<[^>]+>/g, '').slice(0, 600));
      console.log('================================================\n');
    } else {
      console.log(`✓ Inquiry email [${ref}] sent via SMTP (messageId=${info.messageId})`);
    }
    lastMailerError = '';
    lastSentAt = new Date().toISOString();
    return { ok: true, info };
  } catch (e) {
    lastMailerError = e.message;
    console.error('Mailer error:', e.message);
    return { ok: false, error: e.message };
  }
}

export function getMailerStatus() {
  return {
    mode: usingRealSmtp ? 'smtp' : 'console',
    configured: usingRealSmtp,
    verified: usingRealSmtp ? smtpVerified : false,
    target: MAIL_TO_BUSINESS,
    lastError: lastMailerError || null,
    lastSentAt,
  };
}

function renderInquiryEmail(i) {
  // Build a unified item list — both tour and activity items live in i.items.
  const allItems = i.items || i.activities || [];
  const tourItems = allItems.filter(x => x.kind === 'tour');
  const activityItems = allItems.filter(x => x.kind === 'activity');

  // M-2: tolerate non-integer day values (e.g. 0.5 for a half-day, or
  // future "1a" labels) by passing them through verbatim. The day-by-day
  // hero in TourDetailPage.jsx still uses the raw value, so the change
  // here is server-side only and the seed data's integer values render
  // identically to before.
  const itineraryLines = (i.itinerary || []).map(
    (d, idx) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;color:#3B4749">${idx + 1}.</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(d.title || '')} ${d.detail ? `<div style="color:#666;font-size:13px;margin-top:2px">${escapeHtml(d.detail)}</div>` : ''}</td></tr>`
  ).join('');

  const tourLines = tourItems.map((t) => {
    const price = typeof t.from === 'number' ? `<span style="color:#C25A23">— $${t.from.toLocaleString()}/pp</span>` : '';
    const dur = t.duration ? `<span style="color:#666">(${escapeHtml(t.duration)})</span>` : '';
    const det = t.detail ? `<div style="color:#666;font-size:13px;margin-top:2px">${escapeHtml(t.detail)}</div>` : '';
    return `<li style="padding:6px 0;list-style:none"><strong>${escapeHtml(t.title)}</strong> ${dur} ${price}${det}</li>`;
  }).join('');

  const activityLines = activityItems.map((a) => {
    const price = a.requires_quote
      ? '<span style="color:#C25A23">— custom quote required</span>'
      : typeof a.from === 'number' ? `<span style="color:#C25A23">— $${a.from.toLocaleString()}/pp</span>` : '';
    const dur = a.duration ? `<span style="color:#666">(${escapeHtml(a.duration)})</span>` : '';
    return `<li style="padding:4px 0"><strong>${escapeHtml(a.title)}</strong> ${dur} ${price}</li>`;
  }).join('');

  return `
  <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;color:#283336;background:#FCFAF4">
    <div style="background:#3B4749;color:#F5F1E7;padding:24px 32px;border-radius:12px 12px 0 0">
      <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#F0B690">Jebri Safaris · Adventure & Tours</div>
      <h1 style="margin:8px 0 0;font-size:26px;color:#FCFAF4">${escapeHtml(i.heading || 'New safari inquiry')}</h1>
      <div style="margin-top:8px;font-size:13px;color:#E6DFD3">Reference: <strong style="font-family:monospace">${escapeHtml(i.reference || '')}</strong></div>
    </div>

    <div style="padding:24px 32px;background:#FCFAF4">
      <h2 style="margin:0 0 12px;font-size:18px;color:#3B4749;border-bottom:2px solid #DC6F35;display:inline-block;padding-bottom:4px">Contact</h2>
      <table style="width:100%;border-collapse:collapse;font-family:Inter,sans-serif;font-size:14px">
        <tr><td style="padding:4px 8px;color:#666;width:140px">Name</td><td style="padding:4px 8px"><strong>${escapeHtml(i.name)}</strong></td></tr>
        <tr><td style="padding:4px 8px;color:#666">Email</td><td style="padding:4px 8px"><a href="mailto:${escapeHtml(i.email)}" style="color:#DC6F35">${escapeHtml(i.email)}</a></td></tr>
        ${i.phone ? `<tr><td style="padding:4px 8px;color:#666">Phone / WhatsApp</td><td style="padding:4px 8px">${escapeHtml(i.phone)}</td></tr>` : ''}
        ${i.country ? `<tr><td style="padding:4px 8px;color:#666">Country</td><td style="padding:4px 8px">${escapeHtml(i.country)}</td></tr>` : ''}
      </table>

      ${i.travel_date || i.start_date || i.end_date || i.flight_date || i.travelers || i.tier ? `
      <h2 style="margin:24px 0 12px;font-size:18px;color:#3B4749;border-bottom:2px solid #DC6F35;display:inline-block;padding-bottom:4px">Trip basics</h2>
      <table style="width:100%;border-collapse:collapse;font-family:Inter,sans-serif;font-size:14px">
        ${i.start_date ? `<tr><td style="padding:4px 8px;color:#666;width:140px">Start date</td><td style="padding:4px 8px">${escapeHtml(i.start_date)}</td></tr>` : ''}
        ${i.end_date ? `<tr><td style="padding:4px 8px;color:#666">End date</td><td style="padding:4px 8px">${escapeHtml(i.end_date)}</td></tr>` : ''}
        ${i.flight_date ? `<tr><td style="padding:4px 8px;color:#666">Flight date</td><td style="padding:4px 8px">${escapeHtml(i.flight_date)}</td></tr>` : ''}
        ${i.travel_date ? `<tr><td style="padding:4px 8px;color:#666;width:140px">Travel dates</td><td style="padding:4px 8px">${escapeHtml(i.travel_date)}</td></tr>` : ''}
        ${i.travelers ? `<tr><td style="padding:4px 8px;color:#666">Travelers</td><td style="padding:4px 8px">${escapeHtml(String(i.travelers))}</td></tr>` : ''}
        ${i.tier ? `<tr><td style="padding:4px 8px;color:#666">Tier</td><td style="padding:4px 8px">${escapeHtml(i.tier)}</td></tr>` : ''}
        ${i.duration ? `<tr><td style="padding:4px 8px;color:#666">Duration</td><td style="padding:4px 8px">${escapeHtml(i.duration)}</td></tr>` : ''}
        ${i.budget ? `<tr><td style="padding:4px 8px;color:#666">Budget</td><td style="padding:4px 8px">${escapeHtml(i.budget)}</td></tr>` : ''}
      </table>` : ''}

      ${itineraryLines ? `
      <h2 style="margin:24px 0 12px;font-size:18px;color:#3B4749;border-bottom:2px solid #DC6F35;display:inline-block;padding-bottom:4px">Selected tours / day-by-day</h2>
      <table style="width:100%;border-collapse:collapse;font-family:Inter,sans-serif;font-size:14px">${itineraryLines}</table>` : ''}

      ${tourLines ? `
      <h2 style="margin:24px 0 12px;font-size:18px;color:#3B4749;border-bottom:2px solid #DC6F35;display:inline-block;padding-bottom:4px">Tours chosen</h2>
      <ul style="font-family:Inter,sans-serif;font-size:14px;padding-left:20px">${tourLines}</ul>` : ''}

      ${activityLines ? `
      <h2 style="margin:24px 0 12px;font-size:18px;color:#3B4749;border-bottom:2px solid #DC6F35;display:inline-block;padding-bottom:4px">Selected activities</h2>
      <ul style="font-family:Inter,sans-serif;font-size:14px;padding-left:20px">${activityLines}</ul>` : ''}

      ${i.message ? `
      <h2 style="margin:24px 0 12px;font-size:18px;color:#3B4749;border-bottom:2px solid #DC6F35;display:inline-block;padding-bottom:4px">Message</h2>
      <p style="font-family:Inter,sans-serif;font-size:14px;line-height:1.6;background:#F5F1E7;padding:16px;border-radius:8px;border-left:4px solid #DC6F35;white-space:pre-wrap">${escapeHtml(i.message)}</p>` : ''}

      ${typeof i.estimate_total === 'number' ? `
      <div style="margin-top:24px;padding:20px;background:#3B4749;color:#FCFAF4;border-radius:8px;text-align:center">
        <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#F0B690">Estimated total</div>
        <div style="font-size:32px;margin-top:6px;font-weight:bold">$${i.estimate_total.toLocaleString()}</div>
        <div style="font-size:12px;color:#E6DFD3;margin-top:6px">${escapeHtml(i.estimate_label || 'Based on selections — final quote in 24 hours')}</div>
      </div>` : ''}
    </div>

    <div style="padding:20px 32px;background:#E6DFD3;border-radius:0 0 12px 12px;font-family:Inter,sans-serif;font-size:12px;color:#3B4749;text-align:center">
      Jebri Safaris · Arusha, Tanzania<br>
      <strong style="color:#3B4749">Business:</strong> <a href="mailto:jebrisafaris@gmail.com" style="color:#DC6F35">jebrisafaris@gmail.com</a><br>
      <strong style="color:#3B4749">Joshua:</strong> <a href="mailto:ainembabazijoshua8@gmail.com" style="color:#DC6F35">ainembabazijoshua8@gmail.com</a><br>
      <strong style="color:#3B4749">Lowasa:</strong> <a href="mailto:mncblacs@gmail.com" style="color:#DC6F35">mncblacs@gmail.com</a><br>
      +255 657 253 723 &middot; +255 787 996 608
    </div>
  </div>`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strip CR/LF and other control characters from values placed into email
// headers (Subject, Reply-To). Without this, a name like "Hi\r\nBcc: x@y.com"
// could inject extra headers. (The HTML body is already escaped separately.)
function sanitizeHeaderValue(s) {
  return String(s ?? '')
    .replace(/[\r\n\t]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 200);
}
