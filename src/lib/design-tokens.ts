/**
 * Popscicles Product Design Tokens
 * Focus: Premium, minimal frozen aesthetic with icy blue accents.
 */

export const tokens = {
  // Spacing Scale (4px base)
  spacing: {
    xs: '4px',    // 1
    sm: '8px',    // 2
    md: '16px',   // 4
    lg: '24px',   // 6
    xl: '32px',   // 8
    '2xl': '48px', // 12
    '3xl': '64px', // 16
    '4xl': '96px', // 24
    '5xl': '128px', // 32
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans), Inter, system-ui, sans-serif',
      mono: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace',
    },
    lineHeight: {
      none: '1',
      tight: '1.2',
      snug: '1.4',
      normal: '1.5',
      relaxed: '1.6',
    },
    letterSpacing: {
      tighter: '-0.04em', // More aggressive for large display titles
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
      widest: '0.15em',
    },
    size: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
      '7xl': '4.5rem',   // 72px
      '8xl': '6rem',     // 96px
    }
  },

  // Borders & Radius
  border: {
    width: {
      thin: '1px',
      default: '1.5px',
    },
    radius: {
      sm: '4px',
      md: '10px', // Slightly rounder for premium feel
      lg: '16px',
      full: '9999px',
    }
  },

  // Colors (Semantic overrides)
  colors: {
    bg: '#0a0a0a',
    card: '#0d0d0d', // Slightly lighter than bg
    border: '#1a1a1a', // More subtle than before
    accent: '#7dd3fc', // Icy Blue
    text: {
      primary: '#ffffff',
      secondary: '#94a3b8', // Blue-tinted gray
      muted: '#64748b',
    }
  }
};
