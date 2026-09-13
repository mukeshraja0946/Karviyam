const getPublicImageUrl = (imagePath, defaultFallback = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800') => {
  if (!imagePath || typeof imagePath !== 'string') {
    return defaultFallback;
  }

  let clean = imagePath.trim();
  if (!clean || clean === 'undefined' || clean === 'null' || clean === 'false') {
    return defaultFallback;
  }

  // Filter out known broken domain patterns
  if (clean.includes('fabfunda.com')) {
    return defaultFallback;
  }

  // Strip localhost / 127.0.0.1 origins from stored DB strings so they resolve against the active environment
  if (clean.startsWith('http://localhost') || clean.startsWith('https://localhost') || clean.startsWith('http://127.0.0.1')) {
    clean = clean.replace(/^https?:\/\/[^\/]+/, '');
  }

  // Absolute HTTP / HTTPS URLs (e.g. Unsplash, external CDN)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // Normalize relative upload paths
  if (clean.includes('/uploads/')) {
    const match = clean.match(/\/uploads\/.+$/);
    if (match) clean = match[0];
  }

  let baseUrl = (
    process.env.PUBLIC_APP_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.BACKEND_URL ||
    process.env.FRONTEND_URL ||
    'https://karviyam.com'
  ).trim().replace(/\/$/, '').replace(/\/api\/?$/, '');

  const normalizedPath = clean.startsWith('/') ? clean : '/' + clean;
  return `${baseUrl}${normalizedPath}`;
};

module.exports = {
  getPublicImageUrl
};
