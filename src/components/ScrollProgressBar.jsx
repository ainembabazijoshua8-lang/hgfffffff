import { useEffect, useState } from 'react';

export default function ScrollProgressBar({ containerRef = null }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      if (containerRef && containerRef.current) {
        const el = containerRef.current;
        const scrollTop = el.scrollTop;
        const scrollHeight = el.scrollHeight - el.clientHeight;
        const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setProgress(Math.min(100, Math.max(0, percent)));
        return;
      }

      const winScroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const percent = height > 0 ? (winScroll / height) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, percent)));
    };

    if (containerRef && containerRef.current) {
      containerRef.current.addEventListener('scroll', updateProgress, { passive: true });
    } else {
      window.addEventListener('scroll', updateProgress, { passive: true });
    }

    updateProgress();

    return () => {
      if (containerRef && containerRef.current) {
        containerRef.current.removeEventListener('scroll', updateProgress);
      } else {
        window.removeEventListener('scroll', updateProgress);
      }
    };
  }, [containerRef]);

  return (
    <div
      className="fixed top-0 left-0 z-[60] h-[3px] bg-gradient-to-r from-terracotta-400 to-terracotta-500 transition-all duration-150 ease-out"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuomin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="Reading progress"
    />
  );
}
