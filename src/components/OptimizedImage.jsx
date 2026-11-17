import { useRef, useState } from 'react';

const PLACEHOLDER_BG = 'data:image/svg+xml,%3Csvg xmlns="http%3A//www.w3.org/2000/svg"%3E%3C/svg%3E';

export default function OptimizedImage({
  src,
  alt,
  width = 1200,
  height = 800,
  priority = false,
  className = '',
  clickable = false,
  loading = priority ? 'eager' : 'lazy',
  sizes,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  if (!src) return null;

  const aspectRatio = (height / width) * 100;
  const imgClasses = `w-full h-full object-cover transition-opacity duration-500 ${
    loaded ? 'opacity-100' : 'opacity-0'
  } ${className}`;

  const handleError = () => {
    setError(true);
  };

  if (clickable) {
    let ImageLightbox = null;
    try {
      ImageLightbox = require('./ImageLightbox.jsx').default;
    } catch {
      /* ImageLightbox not available, fall back to plain img */
    }

    if (ImageLightbox) {
      return (
        <ImageLightbox src={src} alt={alt} buttonClassName={imgClasses} showLabel={false}>
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            sizes={sizes}
            className={imgClasses}
            onLoad={() => setLoaded(true)}
            onError={handleError}
            {...props}
          />
        </ImageLightbox>
      );
    }
  }

  return (
    <div
      className={`relative overflow-hidden bg-cream-100/50`}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {!loaded && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${PLACEHOLDER_BG})` }}
          aria-label="Loading placeholder"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        sizes={sizes}
        className={imgClasses}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        {...props}
      />
    </div>
  );
}
