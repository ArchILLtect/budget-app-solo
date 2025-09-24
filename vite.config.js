import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        visualizer({
            filename: 'dist/bundle-stats.html',
            gzipSize: true,
            brotliSize: true,
        }),
    ],
    optimizeDeps: {
        include: ['jwt-decode'],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    recharts: ['recharts'],
                },
            },
        },
    },
});
