import type { ReactNode } from 'react';
import Link from 'next/link';

type Tab = 'oggi' | 'peso' | 'spesa';

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function HomeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9.5h13V10" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg {...iconProps}>
      <path d="m3 7 6 6 4-4 8 8" />
      <path d="M15 17h6v-6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

const TABS: { id: Tab; href: string; label: string; icon: ReactNode }[] = [
  { id: 'oggi', href: '/', label: 'Oggi', icon: <HomeIcon /> },
  { id: 'peso', href: '/peso', label: 'Peso', icon: <TrendIcon /> },
  { id: 'spesa', href: '/spesa', label: 'Spesa', icon: <BagIcon /> },
];

export default function BottomNav({ active }: { active: Tab }) {
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-page pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-xl px-2 pt-2 pb-1.5">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-13 flex-1 flex-col items-center justify-center gap-1 text-[13px] ${
                isActive ? 'font-bold text-brand' : 'font-medium text-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
