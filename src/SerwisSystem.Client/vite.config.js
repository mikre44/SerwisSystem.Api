import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The staff app always runs on 5173 and the customer app on 5174,
// because the API allows exactly these two origins (CORS).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
