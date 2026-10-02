"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  Clock,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Search,
  Edit3,
  Check,
  Settings,
  Layers,
  Activity,
  Flame,
  Download,
  Upload,
  X,
  Sliders,
  LayoutGrid,
  List,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";

// Cyber Anvil Vector Icon
function AnvilIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 7h18l-2.5 4H18c-1.5 0-2.5 1-3 2.5l-1 2.5h-4l-1-2.5C8.5 12 7.5 11 6 11H3.5L3 7z" />
      <path d="M6 19h12" />
      <path d="M9 16l-1 3" />
      <path d="M15 16l1 3" />
    </svg>
  );
}

interface IngotItem {
  id: string;
  email: string;
  tag: string;
  status: "ready" | "cooldown";
  cooldownUntil: number | null;
  notes: string;
  lastUsedAt?: number | null;
  strikesCompleted?: number;
}

const DEFAULT_INGOTS: IngotItem[] = [];

function formatRemainingTime(ms: number) {
  if (ms <= 0) return "00d 00h 00m 00s";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, "0");

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export default function AnvilApp() {
  const [mounted, setMounted] = useState(false);
  const [ingots, setIngots] = useState<IngotItem[]>([]);
  const [quenchDays, setQuenchDays] = useState<number>(7);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "ready" | "cooldown"
  >("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [now, setNow] = useState(Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStriking, setIsStriking] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [editingIngot, setEditingIngot] = useState<IngotItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSuperchargeConfirmOpen, setIsSuperchargeConfirmOpen] =
    useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage safely on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("anvil_tokens_data");
      if (saved) {
        setIngots(JSON.parse(saved));
      } else {
        // Fallback check old key or default
        const oldSaved = localStorage.getItem("ag_email_tokens_data");
        setIngots(oldSaved ? JSON.parse(oldSaved) : DEFAULT_INGOTS);
      }
    } catch {
      setIngots(DEFAULT_INGOTS);
    }

    try {
      const savedDays = localStorage.getItem("anvil_quench_days");
      if (savedDays) {
        setQuenchDays(Number(savedDays));
      }
    } catch {
      setQuenchDays(7);
    }

    setMounted(true);
  }, []);

  // Live timer tick and auto thermal quench recovery
  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      setIngots((prev) => {
        let hasChanges = false;
        const updated = prev.map((item) => {
          if (
            item.status === "cooldown" &&
            item.cooldownUntil &&
            item.cooldownUntil <= currentNow
          ) {
            hasChanges = true;
            return {
              ...item,
              status: "ready" as const,
              cooldownUntil: null,
            };
          }
          return item;
        });
        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Save to LocalStorage once mounted
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("anvil_tokens_data", JSON.stringify(ingots));
    } catch (e) {
      console.error("Failed to save ingots to LocalStorage", e);
    }
  }, [ingots, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("anvil_quench_days", String(quenchDays));
    } catch (e) {
      console.error("Failed to save quench config", e);
    }
  }, [quenchDays, mounted]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Forge Strike: Exhaust current token and quench
  const handleStrikeAnvil = (id: string) => {
    const target = ingots.find((e) => e.id === id);
    if (!target) return;

    setIsStriking(true);
    setTimeout(() => setIsStriking(false), 400);

    const quenchTime = Date.now() + quenchDays * 24 * 60 * 60 * 1000;
    const updatedTarget: IngotItem = {
      ...target,
      status: "cooldown",
      cooldownUntil: quenchTime,
      lastUsedAt: Date.now(),
      strikesCompleted: (target.strikesCompleted || 0) + 1,
    };

    const remaining = ingots.filter((e) => e.id !== id);
    setIngots([...remaining, updatedTarget]);
    showToast(
      `⚡ STRIKE! Ingot quenched for ${quenchDays}d. Next core loaded on Anvil!`,
    );
  };

  const handleForceReady = (id: string) => {
    setIngots((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, status: "ready" as const, cooldownUntil: null };
        }
        return item;
      }),
    );
    showToast("Ingot pre-heated and primed on the Anvil.");
  };

  const handleAddIngot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const newEntry: IngotItem = {
      id: Date.now().toString(),
      email: newEmail.trim(),
      tag: newTag.trim() || "General",
      status: "ready",
      cooldownUntil: null,
      notes: newNotes.trim(),
      strikesCompleted: 0,
    };

    setIngots((prev) => [newEntry, ...prev]);
    setNewEmail("");
    setNewTag("");
    setNewNotes("");
    setIsAddModalOpen(false);
    showToast("New ingot cast and forged into rotation queue!");
  };

  const handleDelete = (id: string) => {
    setIngots((prev) => prev.filter((item) => item.id !== id));
    showToast("Ingot melted down and purged from roster.");
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ingots.length) return;

    const updated = [...ingots];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setIngots(updated);
  };

  const handleSuperchargeAll = () => {
    setIngots((prev) =>
      prev.map((item) => ({
        ...item,
        status: "ready" as const,
        cooldownUntil: null,
      })),
    );
    setIsSuperchargeConfirmOpen(false);
    showToast(
      "🔥 ANVIL OVERCLOCK! All ingots instantly supercharged to Ready!",
    );
  };

  const handleUpdateIngot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngot) return;

    setIngots((prev) =>
      prev.map((item) => (item.id === editingIngot.id ? editingIngot : item)),
    );
    setEditingIngot(null);
    showToast("Ingot specifications updated.");
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(ingots, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anvil-tokens-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Anvil token database exported!");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setIngots(parsed);
          showToast(`Imported ${parsed.length} ingots into Anvil!`);
        }
      } catch {
        showToast("Error: Corrupted JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Metrics
  const readyIngots = useMemo(
    () => ingots.filter((e) => e.status === "ready"),
    [ingots],
  );
  const coolingIngots = useMemo(
    () => ingots.filter((e) => e.status === "cooldown"),
    [ingots],
  );
  const activeStrikeIngot = readyIngots[0] || null;
  const nextInLineIngot = readyIngots[1] || null;

  const totalStrikes = useMemo(() => {
    return ingots.reduce((acc, curr) => acc + (curr.strikesCompleted || 0), 0);
  }, [ingots]);

  const forgeHeatScore = useMemo(() => {
    return readyIngots.length * 1500 + totalStrikes * 420;
  }, [readyIngots.length, totalStrikes]);

  const nearestUnlock = useMemo(() => {
    const list = coolingIngots
      .filter((e) => e.cooldownUntil && e.cooldownUntil > now)
      .sort((a, b) => (a.cooldownUntil || 0) - (b.cooldownUntil || 0));
    return list[0] || null;
  }, [coolingIngots, now]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    ingots.forEach((e) => {
      if (e.tag) set.add(e.tag);
    });
    return Array.from(set);
  }, [ingots]);

  const filteredIngots = useMemo(() => {
    return ingots.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        item.email.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const matchesTag = selectedTag === "all" || item.tag === selectedTag;

      if (!matchesSearch || !matchesTag) return false;
      if (filterStatus === "ready") return item.status === "ready";
      if (filterStatus === "cooldown") return item.status === "cooldown";
      return true;
    });
  }, [ingots, searchTerm, filterStatus, selectedTag]);

  // Prevent SSR Hydration Mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#05080f] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#071322] border border-[#00e5ff]/50 flex items-center justify-center text-[#00e5ff] shadow-[0_0_30px_rgba(0,229,255,0.35)] animate-pulse">
            <AnvilIcon className="w-7 h-7" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-300 tracking-[0.2em] uppercase animate-pulse">
            Heating The Anvil...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#05080f] text-slate-100 font-sans antialiased relative selection:bg-[#00e5ff]/20 selection:text-[#00e5ff] transition-all duration-300 ${isStriking ? "brightness-125" : ""}`}
    >
      {/* Background Cyber Steel Glow & Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#00e5ff]/15 via-[#0369a1]/10 to-transparent blur-[150px] opacity-75" />
        <div className="absolute top-[35%] -left-48 w-[650px] h-[550px] bg-[#0a233a]/35 blur-[160px] opacity-50" />
        <div className="absolute -bottom-24 right-[-100px] w-[650px] h-[650px] bg-[#0369a1]/15 blur-[180px] opacity-50" />
        {/* Anvil Matrix Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(0, 229, 255, 0.45) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* Floating Spark Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4.5 py-3 rounded-xl bg-[#091b2e]/95 border border-[#00e5ff]/50 text-white shadow-[0_10px_35px_rgba(0,229,255,0.3)] backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-250">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff] animate-ping" />
          <span className="text-xs font-mono font-medium tracking-wide">
            {toastMessage}
          </span>
        </div>
      )}

      {/* ANVIL FORGE HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#0f3456]/90 bg-[#05080f]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative group cursor-pointer shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00e5ff] via-[#0369a1] to-[#00e5ff] rounded-lg sm:rounded-xl blur-xs opacity-75 group-hover:opacity-100 transition duration-500 animate-aura-pulse" />
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#071322] border border-[#00e5ff]/60 flex items-center justify-center text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.25)]">
                <AnvilIcon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-base font-black tracking-wider uppercase text-white drop-shadow-[0_0_12px_rgba(0,229,255,0.4)] font-mono">
                  ANVIL
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-500">//</span>
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/40 tracking-wider uppercase font-mono shrink-0">
                  <span className="w-1 h-1 rounded-full bg-[#00e5ff] animate-pulse" />
                  <span className="hidden xs:inline">FORGE </span>CORE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight truncate hidden sm:block">
                High-Throughput Token Forge & Aura Crucible
              </p>
            </div>
          </div>

          {/* Quick Hub Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={handleExportData}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-[#091b2e] hover:bg-[#0c2742] hover:text-[#00e5ff] border border-[#0f3456] transition-all cursor-pointer font-mono"
              title="Backup Anvil Database"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-[#091b2e] hover:bg-[#0c2742] hover:text-[#00e5ff] border border-[#0f3456] transition-all cursor-pointer font-mono"
              title="Load Anvil Database"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium text-slate-300 bg-[#091b2e] hover:bg-[#0c2742] hover:text-white border border-[#0f3456] transition-all cursor-pointer shrink-0"
              title="Calibration Settings"
            >
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00e5ff]" />
              <span className="text-[#00e5ff] font-mono font-semibold">{quenchDays}d</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="relative group overflow-hidden inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-extrabold text-slate-950 bg-gradient-to-r from-white via-cyan-100 to-[#00e5ff] hover:brightness-110 shadow-[0_0_15px_rgba(0,229,255,0.35)] transition-all cursor-pointer shrink-0 font-mono"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cast<span className="hidden sm:inline"> Ingot</span></span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN FORGE CONTENT */}
      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-8 pb-20 relative z-10 space-y-6 sm:space-y-7">
        {/* THE ANVIL: Primary Strike Crucible */}
        <section className="relative rounded-2xl overflow-hidden border border-[#0f3456]/90 bg-gradient-to-b from-[#091b2e]/95 via-[#071322]/90 to-[#050b14]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
          {/* Top Molten Cyan Laser Beam */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent opacity-90 shadow-[0_0_10px_#00e5ff]" />

          {/* Ambient Forge Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00e5ff]/20 via-[#0369a1]/10 to-transparent blur-3xl pointer-events-none" />

          <div className="p-4 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
              {/* Ingot Details */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/40 shadow-[0_0_12px_rgba(0,229,255,0.2)] font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#00e5ff] mr-2 shadow-[0_0_8px_#00e5ff] animate-ping" />
                    ON THE ANVIL (PRIMARY CONDUIT)
                  </span>

                  {activeStrikeIngot && (
                    <span className="text-xs font-mono font-medium text-slate-300 bg-[#071728] border border-[#0f3456] px-2.5 py-0.5 rounded-md">
                      TAG:{" "}
                      <span className="text-[#00e5ff] font-semibold">
                        {activeStrikeIngot.tag}
                      </span>
                    </span>
                  )}

                  {activeStrikeIngot?.strikesCompleted !== undefined && (
                    <span className="text-xs font-mono text-slate-400 bg-[#071728] border border-[#0f3456] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#00e5ff]" />
                      {activeStrikeIngot.strikesCompleted} Strikes
                    </span>
                  )}
                </div>

                {activeStrikeIngot ? (
                  <div className="pt-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse shrink-0"
                          title="Ready to use"
                        />
                        <div className="text-xl sm:text-2xl lg:text-3xl font-mono font-black text-white tracking-tight break-all select-all leading-snug">
                          {activeStrikeIngot.email}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleCopy(activeStrikeIngot.email, "anvil-copy")
                        }
                        className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0f3456]/60 hover:bg-[#00e5ff]/20 text-slate-200 hover:text-[#00e5ff] border border-[#0f3456] hover:border-[#00e5ff]/50 transition-all cursor-pointer shrink-0 font-mono"
                        title="Copy Active Ingot Email"
                      >
                        {copiedId === "anvil-copy" ? (
                          <>
                            <Check className="w-4 h-4 text-[#00e5ff]" />
                            <span className="text-[#00e5ff]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Token</span>
                          </>
                        )}
                      </button>
                    </div>

                    {activeStrikeIngot.notes ? (
                      <p className="text-xs text-slate-300/80 flex items-center gap-1.5 font-mono">
                        <span className="text-[#00e5ff]">›</span>
                        {activeStrikeIngot.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 font-mono">
                        Tempered and primed for high-speed operation.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-4">
                    <div className="text-lg font-bold text-slate-200">
                      {ingots.length === 0
                        ? "The Anvil Is Empty"
                        : "All Ingots In Thermal Quench"}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {ingots.length === 0
                        ? "Cast your first email ingot to initialize high-throughput rotation."
                        : "All tokens have exhausted their strike cycle. Supercharge the Anvil or await quench recovery."}
                    </p>
                  </div>
                )}

                {/* Next In Line Preview */}
                {nextInLineIngot && (
                  <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-slate-500 font-mono">
                      Next In Strike Order:
                    </span>
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse shrink-0"
                      title="Ready to use"
                    />
                    <span className="font-mono text-slate-300 font-medium bg-[#071322] px-2 py-0.5 rounded border border-[#0f3456]">
                      {nextInLineIngot.email}
                    </span>
                    <span className="text-[11px] text-[#00e5ff]/80 font-mono">
                      ({nextInLineIngot.tag})
                    </span>
                  </div>
                )}
              </div>

              {/* Anvil Strike Actions */}
              {activeStrikeIngot ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() =>
                      handleCopy(activeStrikeIngot.email, "anvil-btn")
                    }
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white bg-[#091f35] hover:bg-[#0d2c4b] border border-[#00e5ff]/30 hover:border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.15)] transition-all cursor-pointer font-mono"
                  >
                    {copiedId === "anvil-btn" ? (
                      <>
                        <Check className="w-4 h-4 text-[#00e5ff]" />
                        <span>Ready in Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#00e5ff]" />
                        <span>Extract Token</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleStrikeAnvil(activeStrikeIngot.id)}
                    className="w-full sm:w-auto group relative overflow-hidden inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#00e5ff] hover:brightness-120 shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all cursor-pointer font-mono"
                  >
                    <AnvilIcon className="w-4 h-4 shrink-0 stroke-[2.5]" />
                    <span className="truncate">STRIKE ANVIL (Exhaust & Quench)</span>
                  </button>
                </div>
              ) : ingots.length === 0 ? (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-3 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-white via-cyan-100 to-[#00e5ff] shadow-[0_0_25px_rgba(0,229,255,0.4)] cursor-pointer"
                >
                  Cast First Ingot
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* FORGE TELEMETRY MATRIX (4 Chambers) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Chamber 1: Crucible Resonance */}
          <div className="relative rounded-xl p-5 border border-[#0f3456]/80 bg-gradient-to-b from-[#091b2e]/60 to-[#071322]/80 backdrop-blur-md group hover:border-[#00e5ff]/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Crucible Resonance
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-black text-white tracking-tight flex items-baseline gap-1.5">
              <span>{forgeHeatScore.toLocaleString()}</span>
              <span className="text-xs font-normal text-[#00e5ff]">
                HEAT/AURA
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>{totalStrikes} total strikes absorbed</span>
            </div>
          </div>

          {/* Chamber 2: Ready Ingots */}
          <div className="relative rounded-xl p-5 border border-[#0f3456]/80 bg-gradient-to-b from-[#091b2e]/60 to-[#071322]/80 backdrop-blur-md group hover:border-[#00e5ff]/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Forged & Ready
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-black text-[#00e5ff] tracking-tight flex items-baseline gap-1.5">
              <span>{readyIngots.length}</span>
              <span className="text-xs font-normal text-slate-400 font-sans">
                / {ingots.length} Primed
              </span>
            </div>
            <div className="mt-2 w-full bg-[#071728] h-1.5 rounded-full overflow-hidden border border-[#0f3456]">
              <div
                className="h-full bg-gradient-to-r from-[#0369a1] to-[#00e5ff] transition-all duration-500 rounded-full"
                style={{
                  width: `${ingots.length ? (readyIngots.length / ingots.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Chamber 3: Thermal Quench Chamber */}
          <div className="relative rounded-xl p-5 border border-[#0f3456]/80 bg-gradient-to-b from-[#091b2e]/60 to-[#071322]/80 backdrop-blur-md group hover:border-[#00e5ff]/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Thermal Quench
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-black text-sky-400 tracking-tight flex items-baseline gap-1.5">
              <span>{coolingIngots.length}</span>
              <span className="text-xs font-normal text-slate-400 font-sans">
                Quenching
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 font-mono truncate">
              {nearestUnlock && nearestUnlock.cooldownUntil
                ? `Next: ${formatRemainingTime(nearestUnlock.cooldownUntil - now)}`
                : "No active quench timers"}
            </div>
          </div>

          {/* Chamber 4: Forge Kinetic Velocity */}
          <div className="relative rounded-xl p-5 border border-[#0f3456]/80 bg-gradient-to-b from-[#091b2e]/60 to-[#071322]/80 backdrop-blur-md group hover:border-[#00e5ff]/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Forge Velocity
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-black text-white tracking-tight flex items-baseline gap-1.5">
              <span>
                {ingots.length > 0
                  ? Math.round((readyIngots.length / ingots.length) * 100)
                  : 0}
                %
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                SUPERHEATED
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Quench: {quenchDays}d cycle</span>
              <span className="text-[#00e5ff] font-bold">Tier 1</span>
            </div>
          </div>
        </section>

        {/* INGOT QUEUE & FORGE ROSTER */}
        <section className="space-y-3 sm:space-y-4">
          {/* Controls Bar */}
          <div className="p-3 sm:p-4 rounded-xl border border-[#0f3456]/80 bg-[#071322]/90 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
            {/* Search Input */}
            <div className="relative w-full lg:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search ingots by email, tag, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#050b14] border border-[#0f3456] rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills & View Toggles */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 justify-between lg:justify-end">
              {/* Status Segmented Buttons */}
              <div className="grid grid-cols-3 sm:flex bg-[#050b14] border border-[#0f3456] p-1 rounded-lg text-xs font-mono w-full sm:w-auto">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-md font-semibold text-center transition-all ${
                    filterStatus === "all"
                      ? "bg-[#0a233a] text-white shadow-sm border border-[#00e5ff]/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All ({ingots.length})
                </button>
                <button
                  onClick={() => setFilterStatus("ready")}
                  className={`px-1.5 sm:px-3 py-1.5 sm:py-1 rounded-md font-semibold text-center transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                    filterStatus === "ready"
                      ? "bg-[#0a233a] text-emerald-400 shadow-sm border border-emerald-400/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  Ready ({readyIngots.length})
                </button>
                <button
                  onClick={() => setFilterStatus("cooldown")}
                  className={`px-1.5 sm:px-3 py-1.5 sm:py-1 rounded-md font-semibold text-center transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                    filterStatus === "cooldown"
                      ? "bg-[#0a233a] text-sky-400 shadow-sm border border-sky-400/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Quench ({coolingIngots.length})
                </button>
              </div>

              {/* Secondary Tools Row */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                {/* Tag Selector */}
                {allTags.length > 0 && (
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="bg-[#050b14] border border-[#0f3456] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#00e5ff] cursor-pointer font-mono flex-1 sm:flex-none"
                  >
                    <option value="all">All Tags ({allTags.length})</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                )}

                {/* View Switcher */}
                <div className="flex bg-[#050b14] border border-[#0f3456] p-1 rounded-lg text-xs shrink-0">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      viewMode === "list"
                        ? "bg-[#0a233a] text-[#00e5ff]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Forge List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-[#0a233a] text-[#00e5ff]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Forge Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Supercharge Anvil Overclock */}
                {coolingIngots.length > 0 && (
                  <button
                    onClick={() => setIsSuperchargeConfirmOpen(true)}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#00e5ff] bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/40 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.2)] font-mono shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-reverse" />
                    <span className="hidden sm:inline">Supercharge Anvil</span>
                    <span className="sm:hidden">Supercharge</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Roster Items */}
          {filteredIngots.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-dashed border-[#0f3456] bg-[#071322]/50">
              <AnvilIcon className="w-10 h-10 text-slate-600 mx-auto mb-2 stroke-[1.5]" />
              <div className="text-sm font-bold text-slate-300 font-mono">
                No Ingots Found In Crucible
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-mono">
                Deploy a new email ingot into the queue or clear your filter
                parameters.
              </p>
            </div>
          ) : viewMode === "list" ? (
            /* LIST VIEW */
            <div className="rounded-xl border border-[#0f3456]/80 bg-[#071322]/90 backdrop-blur-xl divide-y divide-[#0f3456]/50 overflow-hidden shadow-lg">
              {filteredIngots.map((item, index) => {
                const isReady = item.status === "ready";
                const isTop =
                  activeStrikeIngot && activeStrikeIngot.id === item.id;
                const remainingMs = item.cooldownUntil
                  ? item.cooldownUntil - now
                  : 0;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-200 ${
                      isTop
                        ? "bg-[#00e5ff]/[0.06] border-l-2 border-l-[#00e5ff]"
                        : "hover:bg-[#091f35]/40"
                    }`}
                  >
                    {/* Left: Re-order, Email, Tags, Notes */}
                    <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                      {/* Priority Controls */}
                      <div className="flex flex-col items-center pt-0.5 shrink-0">
                        <button
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          className="text-slate-600 hover:text-[#00e5ff] disabled:opacity-20 disabled:hover:text-slate-600 p-0.5 cursor-pointer"
                          title="Prioritize on the Anvil"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono text-slate-500 my-0.5 font-bold">
                          #{index + 1}
                        </span>
                        <button
                          onClick={() => handleMove(index, "down")}
                          disabled={index === filteredIngots.length - 1}
                          className="text-slate-600 hover:text-[#00e5ff] disabled:opacity-20 disabled:hover:text-slate-600 p-0.5 cursor-pointer"
                          title="Deprioritize"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Ingot Information */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isReady ? (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse shrink-0"
                              title="Ready to use"
                            />
                          ) : (
                            <span
                              className="w-2 h-2 rounded-full bg-sky-500/50 shrink-0"
                              title="In thermal quench"
                            />
                          )}

                          <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-tight break-all select-all">
                            {item.email}
                          </span>

                          <button
                            onClick={() => handleCopy(item.email, item.id)}
                            className="p-1 rounded text-slate-500 hover:text-[#00e5ff] hover:bg-[#0f3456]/40 transition-colors cursor-pointer shrink-0"
                            title="Copy email"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-[#00e5ff]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {item.tag && (
                            <span className="text-[10px] font-mono font-semibold text-slate-300 bg-[#091f35] border border-[#0f3456] px-2 py-0.5 rounded-full shrink-0">
                              {item.tag}
                            </span>
                          )}

                          {isTop && (
                            <span className="text-[10px] font-extrabold tracking-wide uppercase bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 px-2 py-0.5 rounded-full font-mono shrink-0">
                              Active Strike
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-xs text-slate-400 font-mono truncate">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#0f3456]/40 shrink-0">
                      {isReady ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.15)] font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                          <span>Ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 font-mono">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                            <span>Quench</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatRemainingTime(remainingMs)}
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 sm:border-l sm:border-[#0f3456] sm:pl-3">
                        {isReady ? (
                          <button
                            onClick={() => handleStrikeAnvil(item.id)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-[#091f35] hover:bg-[#0369a1] border border-[#0f3456] hover:border-[#00e5ff]/50 rounded-lg transition-all cursor-pointer font-mono"
                            title="Strike ingot into quench chamber"
                          >
                            Strike
                          </button>
                        ) : (
                          <button
                            onClick={() => handleForceReady(item.id)}
                            className="px-2.5 py-1 text-xs font-bold text-[#00e5ff] hover:text-white bg-[#00e5ff]/10 hover:bg-[#00e5ff]/30 border border-[#00e5ff]/40 rounded-lg transition-all cursor-pointer font-mono"
                            title="Force ready status"
                          >
                            Temper
                          </button>
                        )}

                        <button
                          onClick={() => setEditingIngot(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-[#0f3456]/40 rounded-lg transition-colors cursor-pointer"
                          title="Modify ingot"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Purge ingot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIngots.map((item, index) => {
                const isReady = item.status === "ready";
                const isTop =
                  activeStrikeIngot && activeStrikeIngot.id === item.id;
                const remainingMs = item.cooldownUntil
                  ? item.cooldownUntil - now
                  : 0;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between gap-4 ${
                      isTop
                        ? "border-[#00e5ff]/60 bg-[#091f35]/95 shadow-[0_0_25px_rgba(0,229,255,0.2)]"
                        : "border-[#0f3456]/80 bg-[#071322]/85 hover:border-[#00e5ff]/35 hover:bg-[#091f35]/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-mono text-slate-500 font-bold">
                          INGOT #{index + 1}
                        </span>
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                            READY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                            QUENCHING
                          </span>
                        )}
                      </div>

                      <div className="font-mono text-sm font-black text-white break-all select-all flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isReady ? (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse shrink-0"
                              title="Ready to use"
                            />
                          ) : (
                            <span
                              className="w-2 h-2 rounded-full bg-sky-500/50 shrink-0"
                              title="In thermal quench"
                            />
                          )}
                          <span className="truncate">{item.email}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(item.email, item.id)}
                          className="p-1 rounded text-slate-500 hover:text-[#00e5ff] shrink-0 cursor-pointer"
                          title="Copy email"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-[#00e5ff]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        {item.tag && (
                          <span className="text-[10px] font-mono font-semibold text-slate-300 bg-[#050b14] border border-[#0f3456] px-2 py-0.5 rounded-md">
                            {item.tag}
                          </span>
                        )}
                        {item.strikesCompleted !== undefined && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.strikesCompleted} strikes
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="mt-2 text-xs text-slate-400 font-mono line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#0f3456] flex items-center justify-between gap-2">
                      {!isReady && (
                        <span className="text-[11px] font-mono text-slate-400 font-semibold">
                          {formatRemainingTime(remainingMs)}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 ml-auto">
                        {isReady ? (
                          <button
                            onClick={() => handleStrikeAnvil(item.id)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-200 hover:text-white bg-[#0f3456] hover:bg-[#0369a1] rounded-lg transition-colors cursor-pointer font-mono"
                          >
                            Strike
                          </button>
                        ) : (
                          <button
                            onClick={() => handleForceReady(item.id)}
                            className="px-2.5 py-1 text-xs font-bold text-[#00e5ff] hover:text-white bg-[#00e5ff]/15 hover:bg-[#00e5ff]/30 border border-[#00e5ff]/40 rounded-lg transition-colors cursor-pointer font-mono"
                          >
                            Temper
                          </button>
                        )}
                        <button
                          onClick={() => setEditingIngot(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-[#0f3456]/50 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL: CAST NEW INGOT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#05080f]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#071322] border border-[#00e5ff]/45 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(0,229,255,0.25)] relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00e5ff]/15 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                  <AnvilIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
                    Cast New Ingot
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Forge a new identity token into the matrix
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0f3456]/40 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIngot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Account Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="core.strike@domain.io"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#050b14] border border-[#0f3456] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Tag / Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master, Sandbox, Rapid-Fire"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full bg-[#050b14] border border-[#0f3456] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Ingot Notes (Optional)
                </label>
                <textarea
                  placeholder="Tier specifications, rate limits, or context..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#050b14] border border-[#0f3456] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-[#091b2e] hover:bg-[#0c2742] rounded-xl border border-[#0f3456] transition-all cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-white via-cyan-100 to-[#00e5ff] hover:brightness-110 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all cursor-pointer font-mono"
                >
                  Cast Ingot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INGOT */}
      {editingIngot && (
        <div className="fixed inset-0 z-50 bg-[#05080f]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#071322] border border-[#00e5ff]/45 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(0,229,255,0.25)] relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-mono uppercase">
                    Modify Ingot Specifications
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Update conduit credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingIngot(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0f3456]/40 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateIngot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editingIngot.email}
                  onChange={(e) =>
                    setEditingIngot({ ...editingIngot, email: e.target.value })
                  }
                  className="w-full bg-[#050b14] border border-[#0f3456] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Tag / Designation
                </label>
                <input
                  type="text"
                  value={editingIngot.tag}
                  onChange={(e) =>
                    setEditingIngot({ ...editingIngot, tag: e.target.value })
                  }
                  className="w-full bg-[#050b14] border border-[#0f3456] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Notes
                </label>
                <textarea
                  value={editingIngot.notes || ""}
                  onChange={(e) =>
                    setEditingIngot({ ...editingIngot, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-[#050b14] border border-[#0f3456] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingIngot(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-[#091b2e] hover:bg-[#0c2742] rounded-xl border border-[#0f3456] transition-all cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-white via-cyan-100 to-[#00e5ff] hover:brightness-110 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all cursor-pointer font-mono"
                >
                  Save Ingot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ANVIL CONFIGURATION */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-[#05080f]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#071322] border border-[#00e5ff]/45 rounded-2xl max-w-sm w-full p-6 shadow-[0_0_50px_rgba(0,229,255,0.25)] relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-mono uppercase">
                    Anvil Calibration
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Thermal quench parameters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0f3456]/40 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 font-mono">
                  <span>Thermal Quench Period</span>
                  <span className="text-[#00e5ff]">{quenchDays} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={quenchDays}
                  onChange={(e) => setQuenchDays(Number(e.target.value))}
                  className="w-full accent-[#00e5ff] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 font-bold">
                  <span>1 day</span>
                  <span>14 days</span>
                  <span>30 days</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 font-mono leading-relaxed">
                  When an ingot is struck and exhausted, it enters the thermal
                  quench chamber for this duration before automatically
                  returning to the ready state.
                </p>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-white via-cyan-100 to-[#00e5ff] hover:brightness-110 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all cursor-pointer font-mono"
                >
                  Save Calibration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPERCHARGE CONFIRMATION */}
      {isSuperchargeConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-[#05080f]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#071322] border border-[#00e5ff]/50 rounded-2xl max-w-sm w-full p-6 shadow-[0_0_50px_rgba(0,229,255,0.35)] relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#00e5ff]/20 border border-[#00e5ff]/50 flex items-center justify-center text-[#00e5ff] shadow-[0_0_15px_#00e5ff]">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-mono uppercase">
                  Supercharge Anvil?
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Instant Thermal Quench Override
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono mb-6 leading-relaxed">
              This triggers a forge overclock surge, immediately bypassing all
              cooldown timers and restoring every quenched ingot to 100% READY
              on the Anvil.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsSuperchargeConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-[#091b2e] hover:bg-[#0c2742] rounded-xl border border-[#0f3456] transition-all cursor-pointer font-mono"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleSuperchargeAll}
                className="px-5 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-white via-cyan-100 to-[#00e5ff] hover:brightness-110 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.45)] transition-all cursor-pointer font-mono"
              >
                Supercharge All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
