/**
 * Base path helper. Next.js auto-prefixes <Link> and router navigation with
 * basePath, but NOT plain fetch()/href/action/src URLs — those go through api().
 * NEXT_PUBLIC_BASE_PATH is inlined at build time in both server and client code.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function api(path: string): string {
  return `${BASE_PATH}${path}`;
}
