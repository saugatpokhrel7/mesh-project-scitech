import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  // ... other options you like
};

const enhancedConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
  // ... other options you like
})(nextConfig);

export default enhancedConfig;
