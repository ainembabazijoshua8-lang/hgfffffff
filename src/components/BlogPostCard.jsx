import { Link } from 'react-router-dom';

export default function BlogPostCard({ post, priority = false }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block glass-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-glow animate-slide-up"
      style={{ animationDelay: `${post.index !== undefined ? post.index * 100 : 0}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          loading={priority ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 text-xs mb-3">
          <span className="bg-terracotta-50 text-terracotta-600 font-semibold px-3 py-1 rounded-full">
            {post.tag}
          </span>
          <span className="text-teal-700/60 font-medium">
            {post.date} · {post.read} read
          </span>
        </div>

        <h3 className="font-display text-xl text-teal-800 group-hover:text-terracotta-500 transition-colors leading-snug mb-2 line-clamp-2">
          {post.title}
        </h3>

        <p className="text-teal-700/80 text-sm leading-relaxed clamp-3 mb-4">
          {post.excerpt}
        </p>

        <div className="text-terracotta-400 font-semibold text-sm group-hover:text-terracotta-500 transition-colors flex items-center gap-1">
          Read article
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}
