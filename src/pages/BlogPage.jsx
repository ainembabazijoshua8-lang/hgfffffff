import { useState, useMemo } from 'react';
import BlogHeroBanner from '../components/BlogHeroBanner.jsx';
import BlogFilterBar from '../components/BlogFilterBar.jsx';
import BlogPostCard from '../components/BlogPostCard.jsx';

const POSTS = [
  {
    slug: 'great-migration-complete-guide',
    title: 'The Great Migration: A Complete Guide for 2025',
    excerpt: "When and where to witness nature's greatest show — and how to plan a trip around it.",
    image: '/assets/uploads/wilderbeast.jpeg',
    heroImage: '/assets/uploads/wilderbeast river.jpeg',
    date: 'May 12, 2025',
    read: '8 min',
    tag: 'Wildlife',
  },
  {
    slug: 'photography-tips-safari',
    title: '10 Safari Photography Tips from our Guides',
    excerpt: 'How to come home with images you will treasure forever — gear, settings, and timing.',
    image: '/assets/uploads/sunset photography.jpeg',
    heroImage: '/assets/uploads/tourist jeep sunset.jpeg',
    date: 'April 14, 2025',
    read: '5 min',
    tag: 'Photography',
  },
  {
    slug: 'maasai-respectful-cultural-tourism',
    title: 'Visiting Maasai Communities: A Respectful Guide',
    excerpt: 'How to engage with local culture in ways that genuinely benefit the community.',
    image: '/assets/uploads/masai.jpeg',
    heroImage: '/assets/uploads/masai huddle.jpeg',
    date: 'March 30, 2025',
    read: '7 min',
    tag: 'Culture',
  },
  {
    slug: 'safari-with-kids',
    title: 'Planning a Safari with Kids: What Works',
    excerpt: 'Age guidelines, ideal itineraries, and how to keep young explorers engaged.',
    image: '/assets/uploads/lion cubs.jpeg',
    heroImage: '/assets/uploads/jeep interior.jpeg',
    date: 'February 24, 2025',
    read: '6 min',
    tag: 'Family',
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return POSTS.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.tag === activeCategory;
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tag.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  return (
    <>
      <section className="relative bg-teal-800 text-cream-50 py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-vignette opacity-50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,104,61,0.15),transparent_50%)]" />
        <div className="container-x text-center relative z-10">
          <span className="eyebrow text-terracotta-300 drop-shadow-sm">The Travel Journal</span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 animate-slide-up">
            Field notes &amp; planning guides
          </h1>
          <p
            className="mt-6 text-cream-50/90 max-w-2xl mx-auto text-lg sm:text-xl font-light leading-relaxed animate-slide-up"
            style={{ animationDelay: '100ms' }}
          >
            Honest, practical advice from guides who live this stuff year-round.
          </p>
        </div>
      </section>

      <section className="container-x py-12 sm:py-16 lg:py-20">
        {featuredPost && <BlogHeroBanner post={featuredPost} />}

        <BlogFilterBar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultCount={filteredPosts.length}
        />

        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display text-2xl text-teal-800 mb-2">No articles found</h3>
            <p className="text-teal-700/70 mb-6">
              {searchQuery
                ? `No articles match "${searchQuery}".`
                : 'No articles match the selected category.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
              }}
              className="btn-primary"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-auto-fill gap-8">
            {gridPosts.map((post, i) => (
              <BlogPostCard key={post.slug} post={{ ...post, index: i }} />
            ))}
          </div>
        )}

        {filteredPosts.length === 1 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-teal-600/70">
              Showing the featured article only. Remove filters to see more.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
