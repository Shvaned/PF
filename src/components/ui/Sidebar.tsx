"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/manage-resume", label: "Manage Resume", icon: DocIcon },
  { href: "/analyze", label: "Analyze Resume", icon: SearchIcon },
  { href: "/job-hunt", label: "Job Hunt with AI", icon: BriefcaseIcon },
  { href: "/prep", label: "Interview Prep", icon: MessageIcon },
  { href: "/mock-interview", label: "Mock Interview", icon: MicIcon, premium: true },
  { href: "/history", label: "History", icon: ClockIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-[#E5E7EB] z-30 hidden md:flex md:flex-col">
      <div className="px-5 py-5 border-b border-[#E5E7EB]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">PF</span>
          </div>
          <span className="font-semibold text-[#111827] text-[15px]">PrepFit</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm transition-colors duration-150 ${
                isActive
                  ? "bg-[#EFF6FF] text-[#2563EB] font-medium"
                  : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
              }`}
            >
              <link.icon active={isActive} />
              <span className="flex-1">{link.label}</span>
              {link.premium && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-[#E5E7EB]">
        <Link
          href="/premium"
          className="block w-full text-center text-sm font-medium bg-gradient-to-r from-[#60A5FA] to-[#2563EB] text-white rounded-[12px] py-2.5 hover:from-[#2563EB] hover:to-[#1D4ED8] transition-all duration-200"
        >
          Upgrade to Pro
        </Link>
      </div>
    </aside>
  );
}

/* ---- Mobile bottom nav ---- */
const mobileLinks = ["/dashboard", "/analyze", "/job-hunt", "/prep", "/history"];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-30 flex md:hidden">
      {links.filter((l) => mobileLinks.includes(l.href)).map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
              isActive ? "text-[#2563EB]" : "text-[#9CA3AF]"
            }`}
          >
            <link.icon active={isActive} />
            {link.label === "Analyze Resume" ? "Analyze" : link.label === "Interview Prep" ? "Prep" : link.label === "Job Hunt with AI" ? "Jobs" : link.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ---- Icons ---- */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? "#2563EB" : "currentColor"} strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
    </svg>
  );
}

function DocIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? "#2563EB" : "currentColor"} strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? "#2563EB" : "currentColor"} strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BriefcaseIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? "#2563EB" : "currentColor"} strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function MessageIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? "#2563EB" : "currentColor"} strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? "#2563EB" : "currentColor"} strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function ClockIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? "#2563EB" : "currentColor"} strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GearIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? "#2563EB" : "currentColor"} strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
