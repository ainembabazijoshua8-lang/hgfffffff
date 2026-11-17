import { Link } from 'react-router-dom';

export default function BlogHeroBanner({ post }) {
  if (!post) return null;

  return (
    <section className="mb-12">
      <Link
        to={`/blog/${post.slug}`}
        className="group block relative isolate overflow-hidden rounded-3xl"
      >
        <div className="relative aspect-[16/7] min-h-[320px] overflow-hidden">
          <img
            src={post.heroImage || post.image}
            alt=""
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900/90 via-teal-900/60 to-transparent" />
          <div className="absolute inset-0 bg-hero-vignette opacity-40 mix-blend-multiply" />
        </div>

        <div className="absolute inset-x-0 bottom-0 pb-8 container-x text-cream-50">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-terracotta-400 text-cream-50 font-semibold px-3 py-1 rounded-full text-xs">
                {post.tag}
              </span>
              <span className="bg-cream-50/15 border border-cream-50/20 text-cream-100 px-3 py-1 rounded-full text-xs">
                {post.date} · {post.read} read
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-cream-50 group-hover:text-terracotta-300 transition-colors leading-tight mb-3">
              {post.title}
            </h2>

            <p className="text-cream-50/90 text-lg leading-relaxed line-clamp-2 max-w-2xl">
              {post.excerpt}
            </p>

            <div className="mt-4 inline-flex items-center gap-1 text-terracotta-300 font-semibold text-sm group-hover:text-terracotta-200 transition-colors">
              Read the full guide
              <span
                className="group-hover:translate-x-1 transition-transform duration-300"
                aria-hidden="true"
              >
                →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
