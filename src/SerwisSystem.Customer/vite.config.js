import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed port so it never collides with SerwisSystem.Client (5173); the API's
  // CORS allow-list only accepts these two exact origins (Program.cs), so if
  // 5174 is taken, fail instead of silently falling back to a port CORS blocks.
  server: {
    port: 5174,
    strictPort: true,
  },
})
