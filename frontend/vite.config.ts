/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react({
        fastRefresh: process.env.NODE_ENV !== "test",
    })],
    test: {
        environment: "jsdom",
        globals: true,
    },
    server: {
        port: 3000,
        proxy: {
            "/app": {
                target: "http://localhost:3000",
                "rewrite": (path) => {
                    return "/index.html";
                },
            },
        },
    },
});
