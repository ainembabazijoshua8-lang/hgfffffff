/**
 * Structured Data (JSON-LD) generators for SEO.
 * Feature #12: Adds rich results for Google (star ratings, FAQ dropdowns, pricing in search).
 */

/**
 * TouristTrip / Product schema for a tour detail page
 */
export function tourJsonLd(tour, reviews = []) {
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.summary,
    touristType: tour.best_for?.join(', ') || 'Adventure travelers',
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: tour.duration_days,
      itemListElement: tour.itinerary?.map((day, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: day.title || `Day ${i + 1}`,
        description: day.detail,
      })),
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: tour.price_usd,
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString().split('T')[0],
    },
    provider: {
      '@type': 'TravelAgency',
      name: 'Jebri Safaris',
      url: 'https://jebrisafaris.com',
    },
    image: tour.hero_image,
    url: `https://jebrisafaris.com/tours/${tour.slug}`,
    ...(avgRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: reviews.length,
        bestRating: '5',
      },
    }),
  };
}

/**
 * FAQPage schema for the FAQ page
 */
export function faqJsonLd(faqGroups) {
  const mainEntity = faqGroups.flatMap(group =>
    group.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }))
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}

/**
 * Review schema for individual reviews
 */
export function reviewJsonLd(review, tourTitle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: { '@type': 'Person', name: review.author },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: '5',
    },
    itemReviewed: {
      '@type': 'TouristTrip',
      name: tourTitle || 'Jebri Safaris Experience',
    },
    reviewBody: review.body,
  };
}

/**
 * Renders a JSON-LD script tag
 */
export function JsonLdScript({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
