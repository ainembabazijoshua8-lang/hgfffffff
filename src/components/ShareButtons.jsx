import { useState } from 'react';
import { useToast } from './Toast.jsx';

const WHATSAPP_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
  </svg>
);

const X_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.901 1.153c.335.078.66.161.978.248.63.18 1.094.79 1.172 1.424.052.42.04.848-.035 1.266a11.4 11.4 0 01-1.41 4.15 11.3 11.3 0 00-3.2 3.087c-2.786 3.978-6.448 6.47-10.703 7.24a9.2 9.2 0 01-2.73.31 9.4 9.4 0 01-2.724-.404c.536.074 1.07.111 1.606.111 2.17 0 4.21-.73 5.8-1.97a11.2 11.2 0 01-3.43-4.64 11.2 11.2 0 00-.01-4.69c.074.04.148.08.22.12.5.33.96.7 1.37 1.11a7.9 7.9 0 01-1.22-4.37c0-.96.19-1.89.53-2.75 1.45 1.33 3.28 2.06 5.2 2.1.09-.05.18-.1.27-.15a7.9 7.9 0 012.14-2.94 7.8 7.8 0 012.65-1.3c.34-.09.68-.16 1.02-.21.33-.05.66-.08.99-.09.33-.01.66 0 .99.02.33.02.66.05.99.08.32.04.65.08.97.13.32.06.64.12.95.19.31.07.62.15.93.23.3.08.59.19.88.29.29.1.57.2.86.31.28.11.56.23.84.35.27.12.54.25.81.4.27.14.53.29.78.45.25.16.5.32.75.51.24.19.48.37.72.57.23.2.46.39.69.59.22.2.44.41.66.62.22.21.43.43.65.65.21.22.42.44.64.66.21.23.42.45.63.68.21.24.42.47.64.7.21.23.41.46.63.69.21.23.41.46.62.69.21.23.41.46.63.69.21.23.41.46.62.69.22.23.43.46.64.68.22.23.43.46.64.68.22.23.43.46.64.68.22.23.43.46.65.68.22.23.42.46.64.68.22.23.42.46.64.68.22.23.42.46.65.68.21.22.42.45.64.67.22.23.42.46.64.67.22.23.42.46.63.68.21.23.42.46.63.68.22.23.42.46.64.67.22.23.42.46.63.68.22.23.42.46.63.68.22.23.42.46.63.68.22.23.42.46.63.68.21.22.42.45.63.67.22.23.42.46.64.67.21.23.42.45.63.67.22.23.42.46.63.68.22.23.42.46.63.68.22.23.42.46.63.68.22.23.42.46.63.68.21.22.42.45.63.67.21.23.42.45.63.67.22.23.42.45.63.67.21.23.42.45.63.67.21.23.42.45.63.67.21.23.42.45.63.67z" />
  </svg>
);

const LINKEDIN_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);

const COPY_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 2v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H9z" />
  </svg>
);

const SHARE_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.72 19.72 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.78 19.78 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6 2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </svg>
);

export default function ShareButtons({ title, url, description, showLabel = true }) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = title;
  const shareDescription = description || title;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareText} — ${shareDescription}\n\nRead more: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleX = () => {
    const text = encodeURIComponent(shareText);
    const u = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${u}`, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      addToast('Link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Could not copy link', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareDescription,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed silently
      }
    }
  };

  const isMobileShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-teal-700/70 font-medium">
        Share this article:
      </span>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${shareText} — ${shareUrl}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsApp}
        aria-label="Share on WhatsApp"
        className="inline-flex items-center justify-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 font-medium text-xs py-2.5 px-4 rounded-full transition-all duration-200"
      >
        {WHATSAPP_SVG}
        {showLabel && <span>WhatsApp</span>}
      </a>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleX}
        aria-label="Share on X (Twitter)"
        className="inline-flex items-center justify-center gap-1.5 bg-cream-100 text-teal-700 hover:bg-teal-50 font-medium text-xs py-2.5 px-4 rounded-full transition-all duration-200"
      >
        {X_SVG}
        {showLabel && <span>X (Twitter)</span>}
      </a>

      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleLinkedIn}
        aria-label="Share on LinkedIn"
        className="inline-flex items-center justify-center gap-1.5 bg-cream-100 text-blue-700 hover:bg-blue-50 font-medium text-xs py-2.5 px-4 rounded-full transition-all duration-200"
      >
        {LINKEDIN_SVG}
        {showLabel && <span>LinkedIn</span>}
      </a>

      <button
        type="button"
        onClick={handleCopyLink}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        className="inline-flex items-center justify-center gap-1.5 bg-cream-100 text-teal-700 hover:bg-teal-50 font-medium text-xs py-2.5 px-4 rounded-full transition-all duration-200"
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            {COPY_SVG}
            {showLabel && <span>Copy Link</span>}
          </>
        )}
      </button>

      {isMobileShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label="Share via..."
          className="inline-flex items-center justify-center gap-1.5 bg-terracotta-400 text-cream-50 hover:bg-terracotta-500 font-medium text-xs py-2.5 px-4 rounded-full transition-all duration-200 hover:scale-105"
        >
          {SHARE_SVG}
          {showLabel && <span>Share</span>}
        </button>
      )}
    </div>
  );
}
