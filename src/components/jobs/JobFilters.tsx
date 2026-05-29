"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { FilterState } from "@/lib/jobs/filter-engine";
import { DEFAULT_FILTERS } from "@/lib/jobs/filter-engine";

interface Props {
  mode: "setup" | "refine";
  filters: FilterState;
  onChange: (f: FilterState) => void;
  countryOptions: string[];
  cityOptions: string[];
  profileSkills: string[];
  profileExperience: string;
  onFindJobs?: () => void;
  className?: string;
}

const ALL_COUNTRIES = [
  "India", "United States", "Canada", "United Kingdom", "Germany",
  "France", "Australia", "Singapore", "UAE", "Netherlands", "Sweden",
  "Japan", "South Korea", "Brazil", "Mexico", "Spain", "Italy",
  "Poland", "Ukraine", "Nigeria", "Kenya", "South Africa", "Indonesia",
  "Malaysia", "Philippines", "Vietnam", "Thailand", "Remote / Global",
];

const EXPERIENCE_OPTIONS = [
  { value: "intern", label: "Internship" },
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
];

const EMPLOYMENT_OPTIONS = [
  "Full-time", "Internship", "Contract", "Part-time", "Freelance",
];

const REMOTE_OPTIONS = [
  { value: "all", label: "Flexible" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const RECENCY_OPTIONS = [
  { value: "all", label: "Anytime" },
  { value: "today", label: "Last 24h" },
  { value: "3days", label: "Last 3 days" },
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" },
];

export default function JobFilters({ mode, filters, onChange, countryOptions, cityOptions, profileSkills, profileExperience, onFindJobs, className = "" }: Props) {
  const [local, setLocal] = useState<FilterState>(filters);
  const [committed, setCommitted] = useState<FilterState>(filters);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  // Sync local state when parent filters change externally (e.g., "Clear all")
  useEffect(() => {
    setLocal(filters);
    setCommitted(filters);
  }, [filters]);

  // Close country dropdown on outside click
  useEffect(() => {
    if (!countryOpen) return;
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
        setCountrySearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [countryOpen]);

  const update = useCallback((patch: Partial<FilterState>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    if (mode === "setup") {
      onChange(next);
    }
  }, [local, onChange, mode]);

  const apply = useCallback(() => {
    setCommitted(local);
    onChange(local);
  }, [local, onChange]);

  const reset = useCallback(() => {
    setLocal(DEFAULT_FILTERS);
    setCommitted(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
  }, [onChange]);

  const removeFilter = useCallback((key: keyof FilterState, value?: string) => {
    const next = { ...committed };
    if (key === "employmentTypes" && value) {
      next.employmentTypes = next.employmentTypes.filter((t) => t !== value);
    } else if (key === "experienceLevels" && value) {
      next.experienceLevels = next.experienceLevels.filter((l) => l !== value);
    } else if (key === "skillsBoost" && value) {
      next.skillsBoost = next.skillsBoost.filter((s) => s !== value);
    } else {
      (next as any)[key] = (DEFAULT_FILTERS as any)[key];
    }
    setLocal(next);
    setCommitted(next);
    onChange(next);
  }, [committed, onChange]);

  const hasPendingChanges = mode === "refine" && JSON.stringify(local) !== JSON.stringify(committed);

  // Merge profile-suggested countries with full list
  const mergedCountries = [...new Set([...countryOptions, ...ALL_COUNTRIES])];
  const searchLower = countrySearch.toLowerCase().trim();
  const filteredCountries = searchLower
    ? mergedCountries.filter((c) => c.toLowerCase().includes(searchLower))
    : mergedCountries;

  const selectCountry = (c: string) => {
    update({ country: c });
    setCountrySearch("");
    setCountryOpen(false);
  };

  // Collect active filter chips
  const chips: { label: string; key: keyof FilterState; value?: string }[] = [];
  if (committed.country) chips.push({ label: committed.country, key: "country" });
  if (committed.city) chips.push({ label: committed.city, key: "city" });
  if (committed.remoteMode !== "all") chips.push({ label: REMOTE_OPTIONS.find((o) => o.value === committed.remoteMode)?.label || committed.remoteMode, key: "remoteMode" });
  if (committed.datePosted !== "month") chips.push({ label: RECENCY_OPTIONS.find((o) => o.value === committed.datePosted)?.label || committed.datePosted, key: "datePosted" });
  for (const t of committed.employmentTypes) chips.push({ label: t, key: "employmentTypes", value: t });
  for (const l of committed.experienceLevels) chips.push({ label: EXPERIENCE_OPTIONS.find((o) => o.value === l)?.label || l, key: "experienceLevels", value: l });
  for (const s of committed.skillsBoost) chips.push({ label: s, key: "skillsBoost", value: s });
  if (committed.matchScoreMin > 0) chips.push({ label: `${committed.matchScoreMin}%+ match`, key: "matchScoreMin" });
  if (committed.salaryMin) chips.push({ label: `$${committed.salaryMin.toLocaleString()}+`, key: "salaryMin" });

  const filterContent = (
    <div className="space-y-5">
      {/* Row 1: Country + City + Remote */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div ref={countryRef}>
          <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">Country</label>
          <div className="relative">
            <input
              type="text"
              value={countryOpen ? countrySearch : (local.country || "")}
              placeholder={local.country ? "" : "Search countries..."}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setCountryOpen(true);
              }}
              onFocus={() => setCountryOpen(true)}
              className="w-full text-xs px-3 py-2 rounded-[8px] border border-[#E5E7EB] bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
            />
            {local.country && !countryOpen && (
              <button onClick={() => { update({ country: null }); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-[#9CA3AF]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {countryOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-48 overflow-y-auto z-20">
                {filteredCountries.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF] px-3 py-2">No countries found</p>
                ) : (
                  filteredCountries.map((c) => (
                    <button key={c} onClick={() => selectCountry(c)}
                      className={`w-full text-left text-xs px-3 py-2 hover:bg-[#EFF6FF] transition-colors ${local.country === c ? "bg-[#EFF6FF] text-[#2563EB] font-medium" : ""}`}>
                      {local.country === c && <span className="mr-1">✓</span>}{c}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">City</label>
          <select
            value={local.city || ""}
            onChange={(e) => update({ city: e.target.value || null })}
            disabled={local.remoteMode === "remote"}
            className="w-full text-xs px-3 py-2 rounded-[8px] border border-[#E5E7EB] bg-white focus:border-[#2563EB] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">All cities</option>
            {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">Work Mode</label>
          <div className="flex gap-1">
            {REMOTE_OPTIONS.map((o) => (
              <button key={o.value} onClick={() => update({ remoteMode: o.value as FilterState["remoteMode"] })}
                className={`flex-1 text-[10px] px-2 py-2 rounded-[8px] border transition-colors font-medium ${
                  local.remoteMode === o.value
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                }`}>{o.label}</button>
            ))}
          </div>
        </div>
      </div>

      {mode === "refine" && (
      <>
      {/* Row 2: Experience + Employment + Recency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">Experience</label>
          <div className="flex flex-wrap gap-1">
            {EXPERIENCE_OPTIONS.map((o) => (
              <button key={o.value} onClick={() => {
                const next = local.experienceLevels.includes(o.value)
                  ? local.experienceLevels.filter((l) => l !== o.value)
                  : [...local.experienceLevels, o.value];
                update({ experienceLevels: next });
              }}
              className={`text-[10px] px-2 py-1.5 rounded-[6px] border transition-colors font-medium ${
                local.experienceLevels.includes(o.value)
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
              }`}>{o.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">Type</label>
          <div className="flex flex-wrap gap-1">
            {EMPLOYMENT_OPTIONS.map((t) => (
              <button key={t} onClick={() => {
                const next = local.employmentTypes.includes(t)
                  ? local.employmentTypes.filter((et) => et !== t)
                  : [...local.employmentTypes, t];
                update({ employmentTypes: next });
              }}
              className={`text-[10px] px-2 py-1.5 rounded-[6px] border transition-colors font-medium ${
                local.employmentTypes.includes(t)
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
              }`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">Posted</label>
          <select
            value={local.datePosted}
            onChange={(e) => update({ datePosted: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-[8px] border border-[#E5E7EB] bg-white focus:border-[#2563EB] outline-none"
          >
            {RECENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Row 3: Score slider + Skills boost */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">
            Min Match Score: {local.matchScoreMin > 0 ? `${local.matchScoreMin}%` : "Off"}
          </label>
          <input type="range" min={0} max={90} step={10} value={local.matchScoreMin}
            onChange={(e) => update({ matchScoreMin: parseInt(e.target.value) })}
            className="w-full accent-[#2563EB] h-1.5" />
          <div className="flex justify-between text-[9px] text-[#9CA3AF] mt-0.5">
            <span>0%</span><span>30%</span><span>60%</span><span>90%</span>
          </div>
        </div>
        {profileSkills.length > 0 && (
          <div>
            <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">Boost Skills</label>
            <div className="flex flex-wrap gap-1">
              {profileSkills.slice(0, 8).map((s) => (
                <button key={s} onClick={() => {
                  const next = local.skillsBoost.includes(s)
                    ? local.skillsBoost.filter((sk) => sk !== s)
                    : [...local.skillsBoost, s];
                  update({ skillsBoost: next });
                }}
                className={`text-[10px] px-2 py-1 rounded-[6px] border transition-colors font-medium ${
                  local.skillsBoost.includes(s)
                    ? "border-[#22C55E] bg-[#F0FDF4] text-[#16A34A]"
                    : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                }`}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Row 2 for setup mode: Experience + Employment only */}
      {mode === "setup" && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">Experience Level</label>
          <div className="flex flex-wrap gap-1">
            {EXPERIENCE_OPTIONS.map((o) => (
              <button key={o.value} onClick={() => {
                const next = local.experienceLevels.includes(o.value)
                  ? local.experienceLevels.filter((l) => l !== o.value)
                  : [...local.experienceLevels, o.value];
                update({ experienceLevels: next });
              }}
              className={`text-[10px] px-2 py-1.5 rounded-[6px] border transition-colors font-medium ${
                local.experienceLevels.includes(o.value)
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
              }`}>{o.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1 block">Employment Type</label>
          <div className="flex flex-wrap gap-1">
            {EMPLOYMENT_OPTIONS.map((t) => (
              <button key={t} onClick={() => {
                const next = local.employmentTypes.includes(t)
                  ? local.employmentTypes.filter((et) => et !== t)
                  : [...local.employmentTypes, t];
                update({ employmentTypes: next });
              }}
              className={`text-[10px] px-2 py-1.5 rounded-[6px] border transition-colors font-medium ${
                local.employmentTypes.includes(t)
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
              }`}>{t}</button>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Bottom bar: Apply / Reset / Find Jobs */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
        <button onClick={reset} className="text-[11px] text-[#6B7280] hover:text-[#111827] transition-colors">
          Reset
        </button>
        {mode === "setup" && onFindJobs && (
          <button onClick={onFindJobs}
            className="px-6 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-[12px] hover:bg-[#1D4ED8] transition-colors">
            Find Jobs
          </button>
        )}
        {mode === "refine" && (
          <button onClick={apply} disabled={!hasPendingChanges}
            className={`px-6 py-2 rounded-[10px] text-sm font-semibold transition-colors ${
              hasPendingChanges
                ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                : "bg-gray-100 text-[#9CA3AF] cursor-not-allowed"
            }`}>
            Apply Filters
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Active filter chips (refine mode only) */}
      {mode === "refine" && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] text-[#9CA3AF] font-medium">Active:</span>
          {chips.map((chip, i) => (
            <button key={i} onClick={() => removeFilter(chip.key, chip.value)}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] font-medium hover:bg-[#DBEAFE] transition-colors">
              {chip.label}
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          <button onClick={reset} className="text-[10px] text-[#EF4444] hover:underline ml-1">Clear all</button>
        </div>
      )}

      {/* Desktop: panel */}
      <div className={`hidden sm:block mb-5 overflow-hidden transition-all duration-300 ${className}`}>
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {filterContent}
        </div>
      </div>

      {/* Mobile: sheet drawer */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] max-h-[85vh] overflow-y-auto p-5 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-[#111827]">{mode === "setup" ? "Customize Your Search" : "Filters"}</h3>
              <button onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}

      {/* Mobile toggle */}
      <div className="sm:hidden mb-4">
        <button onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-[12px] border border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {mode === "setup" ? "Preferences" : `Filters${chips.length > 0 ? ` (${chips.length})` : ""}`}
        </button>
      </div>
    </>
  );
}
