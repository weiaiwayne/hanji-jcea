/**
 * Editorial-system shelf switch (August 2026 editorial-team decision).
 *
 * The journal uses the public site (UI + web content) only; the online
 * editorial workflow (author/reviewer/editorial/admin portals, login,
 * registration, demo access) is shelved but NOT deleted. While this is
 * false, every portal route and auth endpoint returns 404 and all links
 * to them are hidden from public pages.
 *
 * To bring the editorial system back: set this to true and rebuild
 * (NEXT_PUBLIC_BASE_PATH=/jcea npm run build), then restart the service.
 */
export const EDITORIAL_SYSTEM_ENABLED = false;
