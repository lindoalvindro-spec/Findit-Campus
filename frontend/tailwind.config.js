export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
              "on-primary-fixed-variant": "#173bab",
              "secondary": "#006c4a",
              "on-primary": "#ffffff",
              "on-error-container": "#93000a",
              "primary-fixed-dim": "#b8c4ff",
              "on-primary-fixed": "#001453",
              "on-surface-variant": "#444653",
              "secondary-container": "#82f5c1",
              "primary-fixed": "#dde1ff",
              "surface-container-high": "#e8e7f1",
              "inverse-primary": "#b8c4ff",
              "on-secondary-fixed-variant": "#005137",
              "background": "#fbf8ff",
              "on-secondary-fixed": "#002114",
              "secondary-fixed-dim": "#68dba9",
              "on-tertiary": "#ffffff",
              "tertiary-fixed": "#ffdbce",
              "secondary-fixed": "#85f8c4",
              "on-error": "#ffffff",
              "inverse-on-surface": "#f1f0fa",
              "surface-variant": "#e3e1eb",
              "outline": "#757684",
              "surface-container-lowest": "#ffffff",
              "on-background": "#1a1b22",
              "on-surface": "#1a1b22",
              "tertiary": "#611e00",
              "primary-container": "#1e40af",
              "surface-container-low": "#f4f2fc",
              "inverse-surface": "#2f3037",
              "surface-container-highest": "#e3e1eb",
              "on-secondary-container": "#00714e",
              "on-primary-container": "#a8b8ff",
              "on-tertiary-fixed-variant": "#802a00",
              "error": "#ba1a1a",
              "tertiary-fixed-dim": "#ffb59a",
              "surface-dim": "#dad9e3",
              "surface-container": "#eeedf7",
              "on-tertiary-container": "#ffa583",
              "error-container": "#ffdad6",
              "surface": "#fbf8ff",
              "tertiary-container": "#872d00",
              "on-tertiary-fixed": "#380d00",
              "on-secondary": "#ffffff",
              "surface-bright": "#fbf8ff",
              "primary": "#00288e",
              "surface-tint": "#3755c3",
              "outline-variant": "#c4c5d5"
      },
      "borderRadius": {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "full": "9999px"
      },
      "spacing": {
              "margin-desktop": "48px",
              "base": "4px",
              "sm": "8px",
              "margin-mobile": "16px",
              "xl": "32px",
              "gutter": "24px",
              "xs": "4px",
              "lg": "24px",
              "md": "16px",
              "max-width": "1280px"
      },
      "fontFamily": {
              "body-md": ["Inter"],
              "body-sm": ["Inter"],
              "headline-lg-mobile": ["Inter"],
              "headline-md": ["Inter"],
              "label-sm": ["Inter"],
              "headline-xl": ["Inter"],
              "headline-lg": ["Inter"],
              "body-lg": ["Inter"],
              "label-md": ["Inter"],
              "headline-sm": ["Inter"]
      },
      "fontSize": {
              "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
              "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
              "headline-lg-mobile": ["28px", {"lineHeight": "36px", "fontWeight": "700"}],
              "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
              "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "500"}],
              "headline-xl": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
              "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
              "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
              "label-md": ["14px", {"lineHeight": "16px", "fontWeight": "600"}],
              "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}]
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        blob: 'blob 7s infinite',
        float: 'float 6s ease-in-out infinite',
      }
    }
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/forms')
  ],
}
