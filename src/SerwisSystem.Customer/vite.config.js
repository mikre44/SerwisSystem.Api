import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed port so it never collides with SerwisSystem.Client (5173) and
  // matches the API's CORS allow-list (Program.cs).
  server: {
    port: 5174,
  },
})
