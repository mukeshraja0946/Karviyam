export const resolveImageUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // Read API base URL from Vite env if present
  const viteApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  if (viteApiUrl && (viteApiUrl.startsWith('http://') || viteApiUrl.startsWith('https://'))) {
    const origin = viteApiUrl.replace(/\/api\/?$/, '');
    return `${origin}${relativePath}`;
  }

  // Fallback to window origin in browser
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}${relativePath}`;
  }

  return relativePath;
};
