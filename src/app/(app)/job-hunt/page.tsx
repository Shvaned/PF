"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import JobFilters from "@/components/jobs/JobFilters";
import { applyFilters, buildCountryOptions, buildCityOptions, DEFAULT_FILTERS } from "@/lib/jobs/filter-engine";
import type { FilterState } from "@/lib/jobs/filter-engine";

interface Job {
  jobId: string; title: string; employer: string; location: string;
  remote: boolean; salary: string | null; employmentType: string | null;
  description: string | null; shortDescription: string | null;
  applyUrl: string | null; source: string; datePosted: string | null;
  score: number; matchReasons?: string[]; rawData?: any;
}

interface ProfileContext {
  roles?: string[];
  skills?: string[];
  location?: string | null;
  city?: string | null;
  experienceLevel?: string;
  remote_ok?: boolean;
}

const loadingMessages = [
  "Analyzing your resume...",
  "Extracting your skills & experience...",
  "Finding matching opportunities...",
  "Ranking best fits for you...",
  "Personalizing recommendations...",
];

export default function JobHuntPage() {
  const router = useRouter();

  // Phases: extracting → setup → generating → ready → empty → error → noResume
  const [phase, setPhase] = useState<"extracting" | "setup" | "noResume" | "generating" | "ready" | "empty" | "error">("extracting");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [expandedJob, setExpandedJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<{ rawCount?: number; dedupedCount?: number; mergedFromCache?: number; queries?: string[] } | null>(null);
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(null);

  // Filters — persisted to localStorage
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const saved = localStorage.getItem("jobhunt_filters");
      if (saved) return { ...DEFAULT_FILTERS, ...JSON.parse(saved) };
    } catch {}
    return { ...DEFAULT_FILTERS };
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSetupFilters, setShowSetupFilters] = useState(false);

  const loadingRef = useRef(false);
  const generatingRef = useRef(false);

  // Body scroll lock for modal
  useEffect(() => {
    if (expandedJob) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [expandedJob]);

  // Step 1: Extract profile only — do NOT auto-search
  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    extractProfileAndShowSetup();
  }, []);

  // Animate loading messages
  useEffect(() => {
    if (phase !== "generating") return;
    const timer = setInterval(() => {
      setLoadingIdx((i) => (i + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [phase]);

  // Persist filters to localStorage
  useEffect(() => {
    try { localStorage.setItem("jobhunt_filters", JSON.stringify(filters)); } catch {}
  }, [filters]);

  // Step 1: Extract resume profile + check for compatible cache
  async function extractProfileAndShowSetup() {
    setPhase("extracting");
    try {
      // Check for existing cached session first
      const res = await fetch("/api/jobs/session");
      const data = await res.json().catch(() => ({}));

      if (data.sessions?.length > 0 && data.sessions[0].jobs?.length > 0) {
        const cachedProfile = data.sessions[0].extractedData;
        console.log("[JOBS] resume_scan", { source: "cache", jobCount: data.sessions[0].jobs.length });
        setJobs(data.sessions[0].jobs);
        setSessionId(data.sessions[0].id);
        setFresh(true);
        if (cachedProfile) {
          try {
            const p = typeof cachedProfile === "string" ? JSON.parse(cachedProfile) : cachedProfile;
            setProfileContext({
              roles: p.target_roles,
              skills: p.skills,
              location: p.preferred_locations?.[0],
              experienceLevel: p.experience_level,
              remote_ok: p.remote_ok,
            });
          } catch {}
        }
        setPhase("ready");
        return;
      }

      // No cache — extract profile for defaults
      console.log("[JOBS] resume_scan", { source: "extraction" });
      try {
        const profileRes = await fetch("/api/jobs/profile", { method: "POST" });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          console.log("[JOBS] inferred_profile", {
            roles: profile.roles,
            skills: profile.skills?.slice(0, 3),
            location: profile.location,
            experience: profile.experienceLevel,
          });
          setProfileContext(profile);
          setFilters((prev) => ({
            ...prev,
            country: profile.location || prev.country,
            city: profile.city || prev.city,
            experienceLevels: profile.experienceLevel ? [profile.experienceLevel] : prev.experienceLevels,
            remoteMode: profile.remote_ok ? "remote" : "all",
          }));
        }
      } catch {}

      setPhase("setup");
    } catch {
      setPhase("error");
      setError("Could not load profile. Please try again.");
    }
  }

  // Step 2: User clicked "Find Jobs" — now we search
  async function handleFindJobs() {
    if (generatingRef.current) return;
    generatingRef.current = true;

    console.log("[JOBS] first_search", {
      country: filters.country,
      remoteMode: filters.remoteMode,
      experienceLevels: filters.experienceLevels,
      employmentTypes: filters.employmentTypes,
      hasExistingJobs: jobs.length > 0,
    });

    setPhase("generating");
    setError("");
    setDebugInfo(null);
    try {
      const body: any = {};
      if (filters.country) body.country = filters.country;
      if (filters.city) body.city = filters.city;
      if (filters.datePosted !== "month") body.datePosted = filters.datePosted;
      if (filters.remoteMode !== "all") body.remoteMode = filters.remoteMode;
      if (filters.employmentTypes.length > 0) body.employmentTypes = filters.employmentTypes;

      const res = await fetch("/api/jobs/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 400 && data.error?.includes("No resume selected")) {
        setPhase("noResume");
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed");

      setDebugInfo({
        rawCount: data.rawCount,
        dedupedCount: data.dedupedCount,
        mergedFromCache: data.mergedFromCache,
        queries: data.queries,
      });
      if (data.profile) setProfileContext(data.profile);

      if (data.jobs?.length === 0) {
        setPhase("empty");
        return;
      }

      setJobs(data.jobs);
      setSessionId(data.sessionId);
      setFresh(data.fresh);
      setPhase("ready");
    } catch (e: any) {
      setPhase("error");
      setError(e.message || "Something went wrong.");
    } finally {
      generatingRef.current = false;
    }
  }

  // Post-search filter change — client-side only, "Apply Filters" commits it
  function handleFilterChange(next: FilterState) {
    console.log("[FILTER] local_apply", {
      before_count: jobs.length,
      country: next.country,
      remoteMode: next.remoteMode,
      experienceLevels: next.experienceLevels,
      employmentTypes: next.employmentTypes,
    });
    setFilters(next);
  }

  // Client-side filtering via the filter engine
  const { jobs: filteredJobs, activeCount: activeFilterCount } = useMemo(() => {
    const result = applyFilters(jobs as any, filters, profileContext?.skills || []);
    console.log("[FILTER] after_count", { before: jobs.length, after: result.jobs.length, activeFilters: result.activeCount });
    return result;
  }, [jobs, filters, profileContext]);

  // Build filter option lists from job data
  const countryOptions = useMemo(() => buildCountryOptions(jobs, profileContext?.location), [jobs, profileContext]);
  const cityOptions = useMemo(() => buildCityOptions(jobs, profileContext?.location), [jobs, profileContext]);

  function scoreColor(s: number) {
    if (s >= 75) return "text-green-600";
    if (s >= 50) return "text-blue-600";
    return "text-[#6B7280]";
  }

  function daysAgo(date: string | null) {
    if (!date) return null;
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    return new Date(date).toLocaleDateString();
  }

  function handlePrepareForRole(job: Job) {
    setExpandedJob(null);
    const params = new URLSearchParams();
    params.set("role", job.title);
    if (job.description) {
      params.set("description", job.description.slice(0, 3000));
    }
    router.push(`/analyze?${params.toString()}`);
  }

  // ── No Resume ──
  if (phase === "noResume") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">📄</div>
        <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Job Hunt with AI</h1>
        <p className="text-sm text-[#6B7280] mb-6">Select a resume first to find jobs tailored to your profile.</p>
        <Button href="/manage-resume">Manage Resume</Button>
      </div>
    );
  }

  // ── Extracting profile ──
  if (phase === "extracting") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-[#111827]">Job Hunt with AI</h1>
          <p className="text-sm text-[#6B7280] mt-1">Analyzing your resume...</p>
        </div>
        <Card className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#111827] mb-2">Extracting your skills & preferences</p>
          <div className="w-48 mx-auto h-1.5 bg-gray-200 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-[#2563EB] rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </Card>
      </div>
    );
  }

  // ── Setup — AI resume scan complete, ask user if they want tailored jobs ──
  if (phase === "setup") {
    const hasProfile = (profileContext?.roles?.length ?? 0) > 0;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-[#111827]">Job Hunt with AI</h1>
        </div>

        {/* Intelligent prompt card */}
        <Card className="animate-fade-in-up">
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <h2 className="text-[18px] font-semibold text-[#111827] mb-2">
              {hasProfile ? "Jobs matched to your profile" : "Want us to find jobs tailored to your resume?"}
            </h2>

            {hasProfile && (
              <p className="text-sm text-[#6B7280] mb-4">
                We found a strong fit for:
              </p>
            )}

            {/* Profile highlights */}
            {hasProfile && (
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {profileContext?.roles?.slice(0, 2).map((r: string, i: number) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-medium">
                    {r}
                  </span>
                ))}
                {profileContext?.skills?.slice(0, 3).map((s: string, i: number) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-[#F0FDF4] text-[#16A34A] font-medium">
                    {s}
                  </span>
                ))}
                {profileContext?.experienceLevel && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-[#FFF7ED] text-[#EA580C] font-medium capitalize">
                    {profileContext?.experienceLevel}-level
                  </span>
                )}
              </div>
            )}

            {/* Location + remote hint */}
            <p className="text-xs text-[#9CA3AF] mb-6">
              {profileContext?.location && `Based in ${profileContext.location}`}
              {profileContext?.location && profileContext?.remote_ok && " · "}
              {profileContext?.remote_ok && "Open to remote"}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleFindJobs}
                className="px-8 py-3 bg-[#2563EB] text-white text-sm font-semibold rounded-[14px] hover:bg-[#1D4ED8] transition-all hover:shadow-lg hover:-translate-y-0.5">
                Find Jobs
              </button>
              <button onClick={() => setShowSetupFilters(!showSetupFilters)}
                className={`px-6 py-3 text-sm font-medium rounded-[14px] border transition-colors ${
                  showSetupFilters
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                }`}>
                {showSetupFilters ? "Hide Filters" : "Adjust Filters"}
              </button>
            </div>
          </div>
        </Card>

        {/* Expandable filters panel */}
        {showSetupFilters && (
          <div className="mt-4 animate-fade-in">
            <JobFilters
              mode="setup"
              filters={filters}
              onChange={handleFilterChange}
              countryOptions={countryOptions}
              cityOptions={cityOptions}
              profileSkills={profileContext?.skills || []}
              profileExperience={profileContext?.experienceLevel || "entry"}
              onFindJobs={handleFindJobs}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Generating (searching) ──
  if (phase === "generating") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-[#111827]">Job Hunt with AI</h1>
          <p className="text-sm text-[#6B7280] mt-1">Jobs tailored to your resume</p>
        </div>
        <Card className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#111827] mb-2">{loadingMessages[loadingIdx]}</p>
          <div className="w-48 mx-auto h-1.5 bg-gray-200 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-[#2563EB] rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </Card>
      </div>
    );
  }

  // ── Error ──
  if (phase === "error") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Something went wrong</h1>
        <p className="text-sm text-[#6B7280] mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleFindJobs}>Try Again</Button>
          <Link href="/manage-resume" className="text-sm text-[#2563EB] hover:underline py-2.5">Manage Resume</Link>
        </div>
      </div>
    );
  }

  // ── Empty ──
  if (phase === "empty") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-[24px] font-semibold text-[#111827] mb-2">No jobs found</h1>
        <p className="text-sm text-[#6B7280] mb-2">
          No results for your profile{filters.country ? ` in ${filters.country}` : ""}. Try adjusting your preferences.
        </p>
        {debugInfo?.queries && (
          <div className="mb-4">
            <p className="text-[10px] text-[#9CA3AF] mb-1">Search queries used:</p>
            {debugInfo.queries.map((q: string, i: number) => (
              <span key={i} className="inline-block text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-[#6B7280] mr-1 mb-1">{q}</span>
            ))}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setFilters({ ...DEFAULT_FILTERS }); handleFindJobs(); }}>Broaden Search</Button>
          <Link href="/manage-resume" className="text-sm text-[#2563EB] hover:underline py-2.5">Update Resume</Link>
        </div>
      </div>
    );
  }

  // ── Main Grid ──
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Job Hunt with AI</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {jobs.length} jobs matched to your resume
            {profileContext?.roles && (
              <span className="ml-2 text-[#2563EB]">· {profileContext.roles[0]}</span>
            )}
            {profileContext?.location && (
              <span className="ml-1 text-[#6B7280]">· {profileContext.location}</span>
            )}
            {profileContext?.experienceLevel && (
              <span className="ml-1 text-[#6B7280]">· {profileContext.experienceLevel}-level</span>
            )}
            {fresh && " · cached"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`text-sm px-3 py-1.5 rounded-[10px] border transition-colors ${
              showFilters ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" : "border-[#E5E7EB] text-[#6B7280]"
            }`}>
            Filters
          </button>
        </div>
      </div>

      {/* Smart Filters — refine mode, client-side only */}
      {showFilters && (
        <JobFilters
          mode="refine"
          filters={filters}
          onChange={handleFilterChange}
          countryOptions={countryOptions}
          cityOptions={cityOptions}
          profileSkills={profileContext?.skills || []}
          profileExperience={profileContext?.experienceLevel || "entry"}
        />
      )}

      {/* Smart summary */}
      <p className="text-xs text-[#9CA3AF] mb-4">
        Showing {filteredJobs.length} of {jobs.length} jobs
        {profileContext?.roles?.[0] && <> · Optimized for: <span className="text-[#111827] font-medium">{profileContext.roles[0]}</span></>}
        {profileContext?.location && <> · <span className="text-[#111827]">{profileContext.location}</span></>}
        {profileContext?.experienceLevel && <> · <span className="text-[#111827] capitalize">{profileContext.experienceLevel}-level</span></>}
        {activeFilterCount > 0 && <> · <span className="text-[#2563EB] font-medium">{activeFilterCount} active filter{activeFilterCount !== 1 ? "s" : ""}</span></>}
        {debugInfo?.mergedFromCache ? <> · <span className="text-[#22C55E]">+{debugInfo.mergedFromCache} from cache</span></> : null}
      </p>

      {/* Job grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.jobId}
            onClick={() => setExpandedJob(job)}
            className="bg-white rounded-[16px] p-5 border border-[#E5E7EB] cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#111827] leading-snug pr-2 line-clamp-2">{job.title}</h3>
              <span className={`text-xs font-bold shrink-0 ${scoreColor(job.score)}`}>
                {job.score}%
              </span>
            </div>

            <p className="text-xs text-[#6B7280] mb-2">{job.employer}</p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-[#6B7280]">{job.location}</span>
              {job.remote && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600">Remote</span>
              )}
              {job.employmentType && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{job.employmentType}</span>
              )}
            </div>

            {/* Match reasons */}
            {job.matchReasons && job.matchReasons.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {job.matchReasons.map((r: string, i: number) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-medium">
                    ✓ {r}
                  </span>
                ))}
              </div>
            )}

            {job.shortDescription && (
              <p className="text-xs text-[#9CA3AF] line-clamp-2 mb-2">{job.shortDescription}</p>
            )}

            <div className="flex items-center justify-between text-[10px] text-[#9CA3AF]">
              <span>{daysAgo(job.datePosted) || "Recently"}</span>
              {job.salary && <span>{job.salary}</span>}
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && jobs.length > 0 && (
        <Card className="text-center py-12">
          <p className="text-sm font-medium text-[#111827] mb-2">No cached jobs match your current filters</p>
          <p className="text-xs text-[#6B7280] mb-4">
            {jobs.length} jobs are cached. Your filters are too restrictive — try broadening them.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => handleFilterChange({ ...DEFAULT_FILTERS })}
              className="text-sm text-[#2563EB] hover:underline font-medium">
              Reset Filters
            </button>
            <button onClick={handleFindJobs}
              className="text-sm text-[#2563EB] hover:underline font-medium">
              Broaden Search
            </button>
          </div>
        </Card>
      )}

      {/* ── Expanded Job Modal ── */}
      {expandedJob && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setExpandedJob(null); }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[24px] shadow-2xl max-w-2xl w-full p-6 md:p-8">
            <button onClick={() => setExpandedJob(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#9CA3AF]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-sm font-bold ${scoreColor(expandedJob.score)}`}>
                  {expandedJob.score}% Match
                </span>
                {expandedJob.remote && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">Remote</span>
                )}
              </div>
              <h2 className="text-[20px] font-semibold text-[#111827] mb-1">{expandedJob.title}</h2>
              <p className="text-sm text-[#6B7280]">{expandedJob.employer} · {expandedJob.location}</p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {expandedJob.employmentType && (
                <div className="bg-gray-50 rounded-[10px] p-3">
                  <p className="text-[10px] text-[#9CA3AF] uppercase">Type</p>
                  <p className="text-sm font-medium text-[#111827]">{expandedJob.employmentType}</p>
                </div>
              )}
              {expandedJob.salary && (
                <div className="bg-gray-50 rounded-[10px] p-3">
                  <p className="text-[10px] text-[#9CA3AF] uppercase">Salary</p>
                  <p className="text-sm font-medium text-[#111827]">{expandedJob.salary}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-[10px] p-3">
                <p className="text-[10px] text-[#9CA3AF] uppercase">Posted</p>
                <p className="text-sm font-medium text-[#111827]">{daysAgo(expandedJob.datePosted) || "Recently"}</p>
              </div>
              <div className="bg-gray-50 rounded-[10px] p-3">
                <p className="text-[10px] text-[#9CA3AF] uppercase">Source</p>
                <p className="text-sm font-medium text-[#111827] capitalize">{expandedJob.source}</p>
              </div>
            </div>

            {/* Description */}
            {expandedJob.description ? (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[#111827] mb-2">Description</h3>
                <div className="text-sm text-[#374151] leading-relaxed max-h-64 overflow-y-auto bg-gray-50 rounded-[12px] p-4 whitespace-pre-wrap">
                  {expandedJob.description.slice(0, 2000)}
                  {expandedJob.description.length > 2000 && (
                    <p className="text-xs text-[#9CA3AF] mt-2">Full description on employer site</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-[12px] text-center">
                <p className="text-sm text-[#9CA3AF]">Full description available on the employer's site</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {expandedJob.applyUrl && (
                <a href={expandedJob.applyUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center py-3 bg-[#2563EB] text-white font-semibold rounded-[14px] hover:bg-[#1D4ED8] transition-colors text-sm">
                  Apply Now
                </a>
              )}
              <button onClick={() => handlePrepareForRole(expandedJob)}
                className="flex-1 py-3 border-2 border-[#2563EB] text-[#2563EB] font-semibold rounded-[14px] hover:bg-[#EFF6FF] transition-colors text-sm">
                Prepare for This Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
