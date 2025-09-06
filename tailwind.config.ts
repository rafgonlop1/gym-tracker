import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    // Backgrounds (light)
    'bg-blue-100','bg-emerald-100','bg-green-100','bg-purple-100','bg-orange-100','bg-indigo-100','bg-pink-100','bg-yellow-100',
    // Backgrounds (dark translucent)
    'dark:bg-blue-900/30','dark:bg-emerald-900/30','dark:bg-green-900/30','dark:bg-purple-900/30','dark:bg-orange-900/30','dark:bg-indigo-900/30','dark:bg-pink-900/30','dark:bg-yellow-900/30',
    // Text colors
    'text-blue-700','text-emerald-700','text-green-700','text-purple-700','text-orange-700','text-indigo-700','text-pink-700','text-yellow-700',
    'dark:text-blue-400','dark:text-emerald-400','dark:text-green-400','dark:text-purple-400','dark:text-orange-400','dark:text-indigo-400','dark:text-pink-400','dark:text-yellow-400',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
