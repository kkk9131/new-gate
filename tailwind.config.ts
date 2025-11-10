import type { Config } from "tailwindcss";

const withOpacityValue = (variable: string) => {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}) / 1)`;
    }
    return `rgb(var(${variable}) / ${opacityValue})`;
  };
};

const colorTokens = {
  mist: withOpacityValue('--color-mist'),
  ink: withOpacityValue('--color-ink'),
  cloud: withOpacityValue('--color-cloud'),
  surface: withOpacityValue('--color-surface'),
  'surface-strong': withOpacityValue('--color-surface-strong'),
  'accent-calm': withOpacityValue('--color-accent-calm'),
  'accent-warm': withOpacityValue('--color-accent-warm'),
  'accent-bloom': withOpacityValue('--color-accent-bloom'),
  'accent-sand': withOpacityValue('--color-accent-sand'),
};

const config: Config = {
  // ダークモードをクラスベースで有効化
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // カスタムカラーパレット
      colors: colorTokens,
      // z-index階層定義
      zIndex: {
        'base': '0',
        'dropdown': '100',
        'sticky': '150',
        'modal': '200',
        'toast': '300',
        'tooltip': '400',
      },
      // カスタムアニメーション
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
      },
      boxShadow: {
        floating: '0 30px 80px rgba(31, 40, 53, 0.18)',
        panel: '0 15px 45px rgba(31, 40, 53, 0.12)',
        soft: '0 10px 25px rgba(31, 40, 53, 0.08)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
