import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { VitePWA } from 'vite-plugin-pwa'

// Use base only if explicitly provided (e.g., for production sub-path deployments)
const base = process.env.VITE_PUBLIC_BASE?.trim() || "/";

export default defineConfig({
  base,
  server: { host: "::", port: 5173, open: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      manifest: false,
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
