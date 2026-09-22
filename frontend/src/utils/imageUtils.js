const DEFAULT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'
];

export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Filter out Google Search / Google Images HTML result pages
  if (trimmed.includes('google.com/search') || trimmed.includes('google.co.in/search') || trimmed.includes('tbm=isch') || trimmed.includes('google.com/imgres')) {
    return false;
  }

  // If string contains spaces and no http/uploads/slash/extension, it's title text (e.g. "Test Silk Shirt")
  if (trimmed.includes(' ') && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.includes('/')) {
    return false;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return true;
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.includes('/uploads/')) {
    return true;
  }

  if (/\.(jpg|jpeg|png|webp|avif|gif|svg|mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed)) {
    return true;
  }

  return false;
};

export const isValidAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'false') return false;
  if (trimmed.includes('karviyam_product_placeholder') || trimmed.includes('unsplash.com')) return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('/uploads/') || trimmed.startsWith('data:image/') || trimmed.startsWith('blob:');
};

export const resolveImageUrl = (path, fallbackSeed = 0, updatedAt = null) => {
  if (!isValidImageUrl(path)) {
    const idx = Math.abs(Number(fallbackSeed) || 0) % DEFAULT_FALLBACK_IMAGES.length;
    return DEFAULT_FALLBACK_IMAGES[idx];
  }

  let trimmed = path.trim();

  // Return base64 data URLs and blob URLs directly
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Strip duplicate domain prefixes (e.g. https://karviyam.com/https://karviyam.com/uploads/...)
  if (trimmed.match(/^(https?:\/\/[^\/]+){2,}/)) {
    const match = trimmed.match(/\/uploads\/.+$/);
    if (match) {
      trimmed = match[0];
    }
  }

  // Strip localhost/127.0.0.1 origin prefixes when running in production
  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (!isLocalHost && (trimmed.startsWith('http://localhost') || trimmed.startsWith('https://localhost') || trimmed.startsWith('http://127.0.0.1') || trimmed.startsWith('https://127.0.0.1'))) {
    trimmed = trimmed.replace(/^https?:\/\/[^\/]+/, '');
  }

  // If path is an absolute URL containing /uploads/
  if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && trimmed.includes('/uploads/')) {
    const match = trimmed.match(/\/uploads\/.+$/);
    if (match) {
      trimmed = match[0];
    } else {
      return trimmed;
    }
  } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Resolve relative path against current environment origin / API host
  const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const viteApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  let origin = '';

  if (viteApiUrl && (viteApiUrl.startsWith('http://') || viteApiUrl.startsWith('https://'))) {
    origin = viteApiUrl.replace(/\/api\/?$/, '');
  } else if (typeof window !== 'undefined' && window.location && window.location.origin) {
    origin = window.location.origin;
  }

  const baseResolvedUrl = origin ? `${origin}${relativePath}` : relativePath;

  if (updatedAt && !baseResolvedUrl.includes('data:image/') && !baseResolvedUrl.includes('blob:')) {
    const timeVer = new Date(updatedAt).getTime();
    if (!isNaN(timeVer) && timeVer > 0) {
      const delim = baseResolvedUrl.includes('?') ? '&' : '?';
      return `${baseResolvedUrl}${delim}v=${timeVer}`;
    }
  }

  return baseResolvedUrl;
};

export const isValidVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:video/') || trimmed.startsWith('blob:')) return true;
  return /\.(mp4|webm|ogg|mov|m4v|avi)(\?.*)?$/i.test(trimmed) || trimmed.includes('/video/');
};

export const resolveVideoUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const viteApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  if (viteApiUrl && (viteApiUrl.startsWith('http://') || viteApiUrl.startsWith('https://'))) {
    const origin = viteApiUrl.replace(/\/api\/?$/, '');
    return `${origin}${relativePath}`;
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}${relativePath}`;
  }

  return relativePath;
};

export const handleImageError = (e, fallbackSeed = 0) => {
  if (!e || !e.target) return;
  e.target.onerror = null;
  const idx = Math.abs(Number(fallbackSeed) || 0) % DEFAULT_FALLBACK_IMAGES.length;
  e.target.src = DEFAULT_FALLBACK_IMAGES[idx];
};
