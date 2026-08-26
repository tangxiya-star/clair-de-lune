import { defineConfig, loadEnv } from "vite";

// Runs the same serverless handler under `vite dev` so the proxy behaves
// identically locally and on Vercel.
function apiRoute(env) {
  return {
    name: "lattice-api",
    configureServer(server) {
      process.env.QUIVER_API_KEY =
        process.env.QUIVER_API_KEY ||
        process.env.QUIVERAI_API_KEY ||
        env.QUIVER_API_KEY ||
        env.QUIVERAI_API_KEY ||
        "";

      server.middlewares.use("/api/generate", async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks).toString("utf8");

        const { default: handler } = await server.ssrLoadModule("/api/generate.js");
        await handler(
          { method: req.method, body: raw },
          {
            status(code) {
              res.statusCode = code;
              return this;
            },
            json(payload) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(payload));
            },
          }
        );
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [apiRoute(env)],
    server: { port: 5173 },
    build: { target: "es2022" },
  };
});
