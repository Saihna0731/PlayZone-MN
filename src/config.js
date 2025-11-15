// Frontend default API base should match the Express server port (server/index.js -> PORT)
// Prefer same-origin in development so CRA devServer can proxy /api to the backend.
// If you need a fixed API host, set REACT_APP_API_URL, otherwise keep empty to use relative '/api'.
export const API_BASE = process.env.REACT_APP_API_URL || '';