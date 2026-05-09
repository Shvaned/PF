"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import UsageBar from "./UsageBar";

export default function Topbar() {
  const { user, loading: isLoaded, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState({ isPremium: false, dailyUsage: 0, remaining: 3, limit: 3 });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      fetch("/api/user/me")
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) setProfile(data);
        })
        .catch(() => {});
    }
  }, [isLoaded, user]);

  return (
    <header className="sticky top-0 z-20 bg-[#F5F7FB]/90 backdrop-blur-sm border-b border-[#E5E7EB]">
      <div className="flex items-center justify-between h-14 px-5">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#2563EB] flex items-center justify-center">
            <span className="text-white font-semibold text-xs">PF</span>
          </div>
          <span className="font-semibold text-[#111827] text-sm">PrepFit</span>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3 ml-auto">
          {user && (
            <UsageBar
              remaining={profile.remaining}
              limit={profile.limit}
              isPremium={profile.isPremium}
            />
          )}

          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-full hover:ring-2 ring-[#E5E7EB] transition-all"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                  <span className="text-sm font-medium text-[#2563EB]">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "?"}
                  </span>
                </div>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-[12px] shadow-lg border border-[#E5E7EB] py-1">
                <div className="px-4 py-2 border-b border-[#E5E7EB]">
                  <p className="text-sm font-medium text-[#111827] truncate">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs text-[#9CA3AF] truncate">
                    {user?.email || ""}
                  </p>
                </div>
                <button
                  onClick={() => signOut().then(() => router.push("/"))}
                  className="w-full text-left px-4 py-2 text-sm text-[#6B7280] hover:bg-gray-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
