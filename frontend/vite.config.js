import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
  host: '0.0.0.0',
  port: 3000,  // меняете с 3000 на 5173
  open: false
},
preview: {
  host: '0.0.0.0',
  port: 3000 // 3000 // for local 
}
})
