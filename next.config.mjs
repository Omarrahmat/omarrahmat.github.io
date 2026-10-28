/** Static export: every page, including each provider profile, is pre-rendered
 *  as plain HTML so it can be hosted anywhere and is easy for search engines to read. */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
