import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { buildWhatsAppMessage, openWhatsApp } from '../utils/whatsapp.js';

const initial = {
  name: '', email: '', phone: '', country: '',
  tour_id: '', travel_date: '', travelers: 2,
  message: '', website: '',
};

export default function BookingForm({ tours = [], compact = false, defaultTourId = '', source = 'booking' }) {
  const [params] = useSearchParams();
  const preselect = defaultTourId || params.get('tour') || '';
  const [data, setData] = useState({ ...initial, tour_id: preselect });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', msg: '', ref: '' });

  const update = k => e => {
    setData(d => ({ ...d, [k]: e.target.value }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  function validate(values) {
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Please share your full name.';
    if (!values.email.trim()) nextErrors.email = 'Please add an email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = 'Please enter a valid email address.';
    if (!values.message.trim()) nextErrors.message = 'Please tell us about your dream trip.';
    else if (values.message.trim().length < 10) nextErrors.message = 'A little more detail helps us prepare a better quote.';
    if (!values.travelers || Number(values.travelers) < 1) nextErrors.travelers = 'Please include at least one traveler.';
    return nextErrors;
  }

  async function submit(e) {
    e.preventDefault();
    const nextErrors = validate(data);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({ state: 'err', msg: 'Please fix the highlighted fields before sending your enquiry.' });
      return;
    }

    setStatus({ state: 'loading', msg: 'Submitting your enquiry…', ref: '' });

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone.trim() || undefined,
          country: data.country.trim() || undefined,
          tour_id: data.tour_id || undefined,
          travel_date: data.travel_date || undefined,
          travelers: Number(data.travelers) || 2,
          message: data.message.trim(),
          source: source,
          website: data.website || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.ok) {
        throw new Error(resData.error || 'Could not send enquiry.');
      }

      const refCode = resData.reference || 'JS-CONFIRMED';
      setStatus({
        state: 'ok',
        msg: `Enquiry successfully received (Ref: #${refCode}). Our local Arusha team will reply within 24 hours.`,
        ref: refCode,
      });

      // Prepare and open WhatsApp
      openWhatsApp(buildWhatsAppMessage(`Safari booking enquiry [Ref: #${refCode}]`, {
        Reference: refCode,
        Name: data.name,
        Email: data.email,
        'Phone / WhatsApp': data.phone,
        Country: data.country,
        Tour: data.tour_id || 'Custom itinerary',
        'Travel date': data.travel_date,
        Travelers: data.travelers,
        Message: data.message,
      }));
    } catch (err) {
      // Fallback: still open WhatsApp directly
      openWhatsApp(buildWhatsAppMessage('Safari booking enquiry', {
        Name: data.name,
        Email: data.email,
        'Phone / WhatsApp': data.phone,
        Country: data.country,
        Tour: data.tour_id || 'Custom itinerary',
        'Travel date': data.travel_date,
        Travelers: data.travelers,
        Message: data.message,
      }));
      setStatus({
        state: 'ok',
        msg: 'WhatsApp opened with your booking details ready to send to our team.',
        ref: '',
      });
    }
  }

  return (
    <form onSubmit={submit} className={`grid gap-4 ${compact ? '' : 'bg-cream-50 p-6 sm:p-8 rounded-2xl shadow-card'}`}>
      <h3 className="font-display text-2xl text-teal-700">Plan your safari</h3>
      <p className="text-teal-700/70 text-sm -mt-2">Tell us about your trip — our team will reply via email and WhatsApp.</p>
      <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-sm text-teal-700">
        Your enquiry is saved securely and a copy will be prepared on WhatsApp for instant guidance.
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="b-name">Full name *</label>
          <input id="b-name" required minLength={2} value={data.name} onChange={update('name')} className={`field ${errors.name ? 'border-red-400' : ''}`} placeholder="Jane Doe" aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="b-email">Email *</label>
          <input id="b-email" required type="email" value={data.email} onChange={update('email')} className={`field ${errors.email ? 'border-red-400' : ''}`} placeholder="jane@example.com" aria-invalid={Boolean(errors.email)} />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="b-phone">Phone / WhatsApp</label>
          <input id="b-phone" value={data.phone} onChange={update('phone')} className="field" placeholder="+1 555 123 4567" />
        </div>
        <div>
          <label className="label" htmlFor="b-country">Country</label>
          <input id="b-country" value={data.country} onChange={update('country')} className="field" placeholder="United States" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <label className="label" htmlFor="b-tour">Preferred tour</label>
          <select id="b-tour" value={data.tour_id} onChange={update('tour_id')} className="field">
            <option value="">Custom / undecided</option>
            {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="b-date">Travel date</label>
          <input id="b-date" type="date" value={data.travel_date} onChange={update('travel_date')} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="b-travelers">Travelers</label>
          <input id="b-travelers" type="number" min={1} max={50} value={data.travelers} onChange={update('travelers')} className={`field ${errors.travelers ? 'border-red-400' : ''}`} aria-invalid={Boolean(errors.travelers)} />
          {errors.travelers && <p className="mt-1 text-sm text-red-600">{errors.travelers}</p>}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="b-msg">Tell us about your dream trip *</label>
        <textarea id="b-msg" required minLength={10} rows={4} value={data.message} onChange={update('message')} className={`field ${errors.message ? 'border-red-400' : ''}`} placeholder="Dates, group size, special requests, mobility considerations, etc." aria-invalid={Boolean(errors.message)} />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
      </div>

      {/* honeypot — bots fill, humans never see */}
      <div style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
        <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={data.website} onChange={update('website')} /></label>
      </div>

      <button type="submit" disabled={status.state === 'loading'} className="btn-primary disabled:opacity-60">
        {status.state === 'loading' ? 'Sending…' : 'Send Enquiry'}
      </button>

      {status.state === 'err' && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">{status.msg}</div>
      )}
      {status.state === 'ok' && (
        <div className="rounded-xl border border-sage-200 bg-sage-50 p-4 text-sm text-sage-700">{status.msg}</div>
      )}
    </form>
  );
}
