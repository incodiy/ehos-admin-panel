export const AUTH_ACCESS_COOKIE = "ehos_access";
export const AUTH_REFRESH_COOKIE = "ehos_refresh";

/** TTL cookie (detik). Access token mengikuti TTL backend (refreshed otomatis di middleware). */
export const ACCESS_COOKIE_MAX_AGE = 60 * 30;
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** Ambang refresh (detik) — refresh saat token tersisa <= 60 detik. */
export const ACCESS_REFRESH_THRESHOLD = 60;