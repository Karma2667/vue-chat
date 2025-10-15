// ~/nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  },

  app: {
    head: {
      title: 'Chat App',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: 'Modern Vue 3 + Nuxt 4 Chat Application' },
      ],
      link: [],
    },
  },

  vite: {
    define: {
      'process.env': {},
    },
  },

  typescript: {
    typeCheck: true,
    strict: true,
  },
})