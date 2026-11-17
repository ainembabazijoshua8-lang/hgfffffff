export const WHATSAPP_NUMBER = '255657253723';

export function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function buildWhatsAppMessage(title, fields = {}) {
  const lines = [`Jebri Safaris - ${title}`, ''];
  Object.entries(fields).forEach(([label, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      lines.push(`${label}: ${value}`);
    }
  });
  lines.push('', 'Please help me plan this safari.');
  return lines.join('\n');
}
