/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Cinematic Rail Brief — Financial Rail Deep DNA ── */
        /* Background: cold obsidian + slate-blue undertone     */
        /* Luminance < 10% — NOT pure black                     */
        'rr-bg':       '#060d1a',   // deep navy-obsidian
        'rr-surface':  '#0b1628',   // slate-blue surface
        'rr-surface2': '#0f1f35',   // elevated card surface
        'rr-border':   '#1a2d4a',   // blue-slate border
        /* Accent — unchanged */
        'rr-cyan':     '#38BDF8',
        'rr-indigo':   '#818CF8',
        'rr-green':    '#34D399',
        'rr-amber':    '#FBBF24',
        'rr-red':      '#F87171',
        'rr-muted':    '#64748B',
        'rr-text':     '#E2E8F0',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      animation: {
        'slide-in': 'slide-in-right 0.32s cubic-bezier(0.4,0,0.2,1) forwards',
        'slide-out': 'slide-out-right 0.28s cubic-bezier(0.4,0,0.2,1) forwards',
      },
    },
  },
  plugins: [],
}