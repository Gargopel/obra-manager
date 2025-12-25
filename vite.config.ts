import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  base: './', // Adicionado para garantir caminhos relativos na produção (necessário para cPanel/subdiretórios)
  server: {
    host: "::",
    port: 8080,
    // Adicionando fallback para index.html para rotas do React Router
    historyApiFallback: true,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));