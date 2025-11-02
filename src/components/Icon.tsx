import type { JSX, SVGProps } from 'react';

export type IconName =
  | 'activity'
  | 'alert'
  | 'bug'
  | 'chevron-down'
  | 'chevron-up'
  | 'code'
  | 'external-link'
  | 'git-branch'
  | 'git-commit'
  | 'key'
  | 'link'
  | 'package'
  | 'package-export'
  | 'search'
  | 'shield'
  | 'check-circle'
  | 'x-circle';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

const strokeWidth = 1.5;

const iconPaths: Record<IconName, JSX.Element> = {
  activity: (
    <polyline points="4 12 9 12 12 4 15 20 20 12" />
  ),
  alert: (
    <>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0z" />
    </>
  ),
  bug: (
    <>
      <path d="M19 8h-2.5l-1-2H8.5l-1 2H5" />
      <path d="M12 12v4" />
      <path d="M7 12h10" />
      <path d="M7 16h10" />
      <path d="M11 4 9 2" />
      <path d="M13 4 15 2" />
      <rect x="7" y="8" width="10" height="12" rx="3" />
    </>
  ),
  'chevron-down': <polyline points="6 9 12 15 18 9" />,
  'chevron-up': <polyline points="6 15 12 9 18 15" />,
  code: (
    <>
      <polyline points="8 17 2 12 8 7" />
      <polyline points="16 7 22 12 16 17" />
    </>
  ),
  'external-link': (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
  'git-branch': (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M9 6h6" />
      <path d="M6 9v6" />
      <path d="M9 18h6a3 3 0 0 0 3-3v-3" />
    </>
  ),
  'git-commit': (
    <>
      <circle cx="12" cy="12" r="3" />
      <line x1="3" y1="12" x2="9" y2="12" />
      <line x1="15" y1="12" x2="21" y2="12" />
    </>
  ),
  key: (
    <>
      <circle cx="7" cy="14" r="3" />
      <path d="m10 12 10-10 2 2-10 10" />
      <path d="m10 16 4-4" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l1.92-1.92a5 5 0 0 0-7.07-7.07l-1.22 1.22" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-1.92 1.92a5 5 0 0 0 7.07 7.07l1.22-1.22" />
    </>
  ),
  package: (
    <>
      <path d="m21 16-9 5-9-5 9-5 9 5" />
      <path d="M12 21V11" />
      <path d="m3 7 9 5 9-5-9-5-9 5z" />
    </>
  ),
  'package-export': (
    <>
      <path d="m21 16-9 5-9-5 9-5 9 5" />
      <path d="M12 21V11" />
      <path d="m3 7 9 5 9-5-9-5-9 5z" />
      <polyline points="12 3 12 8 15 6.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="9 12 11 14 15 10" />
    </>
  ),
  'x-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </>
  )
};

export const Icon = ({ name, width = 24, height = 24, stroke = 'currentColor', ...rest }: IconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {iconPaths[name]}
  </svg>
);
