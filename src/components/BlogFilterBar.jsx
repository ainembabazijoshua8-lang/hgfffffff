import { Link } from 'react-router-dom';

const CATEGORIES = ['All', 'Wildlife', 'Photography', 'Culture', 'Family'];

export default function BlogFilterBar({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  resultCount = 0,
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:items-center sm:justify-between gap-4 sm:flex-row">
        <nav
          aria-label="Filter blog posts by category"
          className="flex items-center gap-2 overflow-x-auto py-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:py-0"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                aria-pressed={isActive}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
                  transition-all duration-200 focus:outline-none
                  ${
                    isActive
                      ? 'bg-terracotta-400 text-cream-50 shadow-md'
                      : 'bg-cream-100 text-teal-700 hover:bg-terracotta-50 hover:text-terracotta-500 border border-savanna-200'
                  }
                `}
              >
                {cat}
              </button>
            );
          })}
        </nav>

        <div className="relative w-full sm:w-64">
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <div className="relative">
            <svg
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              id="blog-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search articles..."
              className="field h-10 rounded-full pl-10 pr-3 text-sm bg-cream-50 focus:bg-cream-50 border-savanna-200 focus:ring-terracotta-300"
              aria-label="Search articles by keyword"
            />
          </div>
        </div>
      </div>

      {searchQuery && resultCount === 0 && (
        <p className="mt-4 text-sm text-teal-600/70">
          No articles match "{searchQuery}". Try a different search term.
        </p>
      )}
    </div>
  );
}
