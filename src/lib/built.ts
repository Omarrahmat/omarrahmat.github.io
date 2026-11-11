// What the site build learned from the database before it wrote the pages (scripts/build-static.mjs):
// which profiles their agency has claimed, and which agencies have added a logo.
// These only hold anything while the pages are being built. In the browser both are empty, and the page asks for itself.
type Built = { __CLAIMED?: Set<string>; __LOGOS?: Record<string, string> };
const built = globalThis as unknown as Built;

/** Whether the build knew this profile had been claimed. */
export const builtClaimed = (id: string): boolean => Boolean(built.__CLAIMED?.has(id));

/** The logos the build knew of, as provider id to logo path. */
export const builtLogos = (): Record<string, string> => built.__LOGOS || {};
