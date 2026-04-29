'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function TopTab({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`flex items-center border-r border-gray-700 px-5 text-sm font-bold transition-colors ${
        active ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

export function PageHeader() {
  return (
    <header className="flex h-12 shrink-0 items-stretch border-b-2 border-gray-800 bg-gray-950">
      <Link href="/" className="flex items-center border-r border-gray-700 px-5">
        <span className="text-lg font-black tracking-widest text-white">UtaLab</span>
      </Link>
      <nav className="flex items-stretch">
        <TopTab href="/upload">アップロード</TopTab>
        <TopTab href="/test">採点デモ</TopTab>
      </nav>
    </header>
  );
}
