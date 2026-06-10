// Wrap in dynamic import to catch and log startup errors
let app: any;
try {
  const mod = await import("../artifacts/api-server/dist/app.mjs");
  app = mod.default;
} catch (err) {
  console.error("[api/index] Failed to load app:", err);
  process.exit(1);
}

export default app;
