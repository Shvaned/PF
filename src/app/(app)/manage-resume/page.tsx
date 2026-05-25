"use client";

import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function ManageResumePage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add form
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [pasteText, setPasteText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchResumes(); }, []);

  async function fetchResumes() {
    const res = await fetch("/api/resumes");
    const data = await res.json();
    if (data.resumes) {
      setResumes(data.resumes);
      setSelectedId(data.selectedId);
    }
    setLoading(false);
  }

  async function handlePdfUpload(f: File) {
    setParsing(true);
    setError("");
    try {
      const fd = new FormData(); fd.append("file", f);
      const res = await fetch("/api/resume/parse", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Parse failed");
      const data = await res.json();
      setPasteText(data.text);
    } catch {
      setError("Could not parse the PDF. Try pasting instead.");
    } finally { setParsing(false); }
  }

  async function handleSave() {
    if (!pasteText.trim() || pasteText.length < 50) {
      setError("Resume is too short. Please enter at least 50 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: pasteText,
          uploadType: tab,
          fileName: file?.name || null,
        }),
      });
      setShowAdd(false);
      setPasteText("");
      setFile(null);
      fetchResumes();
    } catch { setError("Failed to save resume."); }
    finally { setSaving(false); }
  }

  async function handleSelect(id: string) {
    await fetch(`/api/resumes/${id}`, { method: "PATCH" });
    setSelectedId(id);
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/resumes/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchResumes();
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto"><div className="h-40 bg-gray-50 rounded-[16px] animate-pulse" /></div>;
  }

  const previewResume = resumes.find((r) => r.id === previewId);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Manage Resume</h1>
          <p className="text-sm text-[#6B7280] mt-1">Store and switch between multiple resume versions.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>Add Resume</Button>
      </div>

      {/* Empty state */}
      {!loading && resumes.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">📄</div>
          <h3 className="text-[16px] font-medium text-[#111827] mb-2">No resumes added yet</h3>
          <p className="text-sm text-[#6B7280] mb-4">Upload a PDF or paste your resume to get started.</p>
          <Button onClick={() => setShowAdd(true)}>Add Resume</Button>
        </Card>
      )}

      {/* Resume cards */}
      {resumes.length > 0 && (
        <div className="space-y-3">
          {resumes.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-[16px] p-4 border-2 transition-all ${
                selectedId === r.id
                  ? "border-[#2563EB] shadow-[0_0_0_2px_rgba(37,99,235,0.15)]"
                  : "border-[#E5E7EB] hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-medium text-[#111827] truncate">{r.title}</h3>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      r.uploadType === "pdf" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                    }`}>{r.uploadType === "pdf" ? "PDF" : "Paste"}</span>
                    {selectedId === r.id && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    {new Date(r.createdAt).toLocaleDateString()} · {r.content.length} chars
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {selectedId !== r.id && (
                    <button onClick={() => handleSelect(r.id)} className="text-xs font-medium text-[#2563EB] hover:underline">
                      Select
                    </button>
                  )}
                  <button onClick={() => setPreviewId(r.id)} className="text-xs text-[#6B7280] hover:text-[#111827]">
                    Preview
                  </button>
                  <button onClick={() => setDeleteId(r.id)} className="text-xs text-red-400 hover:text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-[20px] shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-[18px] font-semibold text-[#111827] mb-4">Add Resume</h2>

            <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-[10px]">
              {(["paste","upload"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 text-sm py-1.5 rounded-[8px] transition-colors ${
                    tab === t ? "bg-white shadow-sm font-medium text-[#111827]" : "text-[#6B7280]"
                  }`}>{t === "paste" ? "Paste Resume" : "Upload PDF"}</button>
              ))}
            </div>

            {tab === "paste" ? (
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your full resume here..." rows={8}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-y" />
            ) : (
              <div>
                <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); handlePdfUpload(f); } }} />
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[#E5E7EB] rounded-[12px] p-8 text-center cursor-pointer hover:border-[#2563EB] transition-colors">
                  {parsing ? (
                    <div>
                      <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-[#6B7280]">Parsing PDF...</p>
                    </div>
                  ) : pasteText && tab === "upload" ? (
                    <div>
                      <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm text-green-600 font-medium">PDF parsed</p>
                      <p className="text-xs text-[#9CA3AF] mt-1">{file?.name}</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-[#6B7280]">Click to upload PDF</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <div className="flex gap-3 mt-4">
              <Button onClick={handleSave} loading={saving} className="flex-1">{saving ? "Saving..." : "Save Resume"}</Button>
              <Button onClick={() => setShowAdd(false)} variant="secondary" className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewResume && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewId(null)} />
          <div className="relative bg-white rounded-[20px] shadow-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-[#111827]">{previewResume.title}</h3>
              <button onClick={() => setPreviewId(null)} className="text-[#9CA3AF] hover:text-[#111827]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <pre className="text-sm text-[#374151] whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-[12px] p-4">
              {previewResume.content}
            </pre>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-[20px] shadow-2xl max-w-sm w-full p-6 text-center">
            <h3 className="text-[16px] font-medium text-[#111827] mb-2">Delete this resume?</h3>
            <p className="text-sm text-[#6B7280] mb-4">This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
              <Button onClick={() => setDeleteId(null)} variant="secondary">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
