const isDev = process.env.NODE_ENV === 'development';
const defaultUrl = isDev ? 'http://localhost:5001' : 'https://wattbaord.onrender.com';
const rawUrl = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
