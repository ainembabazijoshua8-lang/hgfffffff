import { useEffect, useState } from 'react';

export default function TableOfContents({ sections, activeSection, onSectionClick }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.matchMedia('(min-width: 1024px)').matches);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleNavClick = (id) => {
    onSectionClick(id);
  };

  if (!sections || sections.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="mb-8 lg:mb-0 lg:sticky lg:top-24">
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200">
          <h3 className="font-display text-lg text-teal-800 flex items-center gap-2">
            <span aria-hidden="true">📖</span>
            On this page
          </h3>
          {isDesktop ? (
            <span className="text-xs text-teal-500">{sections.length} sections</span>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Show table of contents" : "Hide table of contents"}
              aria-expanded={!collapsed}
              className="p-1.5 rounded-lg hover:bg-cream-100 text-teal-600 transition"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {!collapsed && (
          <ol className="py-2">
            {sections.map((s, i) => {
              const isActive = activeSection === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(s.id)}
                    className={`w-full text-left flex items-start gap-3 px-5 py-2.5 transition-all duration-200 group ${
                      isActive
                        ? "text-terracotta-500 bg-terracotta-50/60"
                        : "text-teal-700 hover:text-terracotta-500 hover:bg-cream-100"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center mt-0.5 transition-colors ${
                        isActive
                          ? "bg-terracotta-400 text-cream-50"
                          : "bg-cream-100 text-teal-500 group-hover:bg-terracotta-100 group-hover:text-terracotta-500"
                      }`}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium leading-snug pt-0.5">
                      {s.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </nav>
  );
}
