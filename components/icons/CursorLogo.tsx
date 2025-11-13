import type { SVGProps } from 'react';

/**
 * Cursor公式ロゴ風のカスタムSVG
 * - currentColor を利用して親側でカラー制御
 * - シンプルな三角ポインタ + シェーディングでブランド感を再現
 */
export function CursorLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Cursor logo"
      {...props}
    >
      <path
        d="M6 3.2l18.2 8.2-6.4 2.8 3.4 13.1-6.1-9.6-5.6 3.6z"
        fill="currentColor"
      />
      <path
        d="M13.2 17.5l3.2-2 2.7 4.4-1.6 2.6-4.3-5z"
        fill="#fff"
        fillOpacity={0.45}
      />
    </svg>
  );
}
