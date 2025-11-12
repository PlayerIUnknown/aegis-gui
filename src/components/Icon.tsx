import type { JSX, SVGProps } from 'react';

export type IconName =
  | 'activity'
  | 'alert'
  | 'bug'
  | 'chevron-down'
  | 'chevron-up'
  | 'code'
  | 'clock'
  | 'external-link'
  | 'git-branch'
  | 'git-commit'
  | 'globe'
  | 'hash'
  | 'info'
  | 'key'
  | 'link'
  | 'moon'
  | 'menu'
  | 'package'
  | 'package-export'
  | 'refresh'
  | 'search'
  | 'shield'
  | 'sun'
  | 'check-circle'
  | 'sparkle'
  | 'user'
  | 'users'
  | 'x'
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
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
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
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  hash: (
    <>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
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
  moon: (
    <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z" />
  ),
  menu: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
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
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="23 4 21 6 19 4" />
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
  sun: (
    <>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="9 12 11 14 15 10" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3 1.3 3.3 3.7.3-2.8 2.3.9 3.6-3.1-1.8-3.1 1.8.9-3.6-2.8-2.3 3.7-.3L12 3z" />
      <path d="M5 14l1 2 2 .2-1.5 1.2.5 1.8-1.6-.9-1.6.9.5-1.8L3 16.2l2-.2 1-2z" />
      <path d="M19 14l.8 1.6 1.8.2-1.4 1.2.4 1.8-1.6-.9-1.6.9.4-1.8-1.4-1.2 1.8-.2L19 14z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21v-2a4.5 4.5 0 0 1 4.5-4.5h4a4.5 4.5 0 0 1 4.5 4.5v2" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
