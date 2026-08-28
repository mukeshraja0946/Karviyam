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

export const resolveImageUrl = (path, fallbackSeed = 0) => {
  if (!isValidImageUrl(path)) {
    const idx = Math.abs(Number(fallbackSeed) || 0) % DEFAULT_FALLBACK_IMAGES.length;
    return DEFAULT_FALLBACK_IMAGES[idx];
  }

  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
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
