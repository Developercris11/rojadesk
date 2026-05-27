"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Users, UserPlus, Trash2, Save, X, Download, Loader2, Check, AlertCircle, Code2, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface TeamMember {
    id: string;
    team: string;
    name: string;
    cedula: string;
    position: string;
    startDate: string;
    increaseDue: string | null;
    email: string;
    leader: string;
    salary: string;
    createdAt: string;
    updatedAt: string;
}

const TEAM_NAME = "Developers";

const COLUMNS = [
    { key: "name", label: "Name", width: "minmax(140px, 1.2fr)" },
    { key: "cedula", label: "Cédula", width: "minmax(100px, 0.8fr)" },
    { key: "position", label: "Position", width: "minmax(140px, 1.1fr)" },
    { key: "startDate", label: "Start Date", width: "minmax(110px, 0.9fr)" },
    { key: "increaseDue", label: "Increase Due", width: "minmax(110px, 0.9fr)" },
    { key: "email", label: "Email", width: "minmax(160px, 1.4fr)" },
    { key: "leader", label: "Leader", width: "minmax(120px, 1fr)" },
    { key: "salary", label: "Salary", width: "minmax(100px, 0.8fr)" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

const EMPTY_ROW = {
    name: "",
    cedula: "",
    position: "",
    startDate: "",
    increaseDue: "",
    email: "",
    leader: "",
    salary: "",
};

export default function TeamsPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Inline editing state: { [memberId]: { [field]: value } }
    const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});

    // New row being added
    const [newRow, setNewRow] = useState<typeof EMPTY_ROW | null>(null);
    const [addingRow, setAddingRow] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const newRowRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchMembers = useCallback(async () => {
        try {
            const res = await fetch(`/api/teams?team=${encodeURIComponent(TEAM_NAME)}`);
            const data = await res.json();
            setMembers(Array.isArray(data) ? data : []);
        } catch {
            showToast("Failed to load team data", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // Focus the first input of the new row when it appears
    useEffect(() => {
        if (newRow && newRowRef.current) {
            newRowRef.current.focus();
        }
    }, [newRow]);

    // ── Inline Edit Helpers ──────────────────────────────────────────────

    const startEdit = (memberId: string, field: string, currentValue: string) => {
        setEdits(prev => ({
            ...prev,
            [memberId]: { ...prev[memberId], [field]: currentValue },
        }));
    };

    const updateEdit = (memberId: string, field: string, value: string) => {
        setEdits(prev => ({
            ...prev,
            [memberId]: { ...prev[memberId], [field]: value },
        }));
    };

    const isEditing = (memberId: string, field: string) => {
        return edits[memberId]?.[field] !== undefined;
    };

    const cancelEdit = (memberId: string, field: string) => {
        setEdits(prev => {
            const copy = { ...prev };
            if (copy[memberId]) {
                delete copy[memberId][field];
                if (Object.keys(copy[memberId]).length === 0) delete copy[memberId];
            }
            return copy;
        });
    };

    const saveEdit = async (memberId: string, field: string) => {
        const value = edits[memberId]?.[field];
        if (value === undefined) return;

        setSaving(memberId);
        try {
            await fetch("/api/teams", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: memberId, [field]: value }),
            });
            // Optimistic: update local state
            setMembers(prev =>
                prev.map(m => (m.id === memberId ? { ...m, [field]: value } : m))
            );
            cancelEdit(memberId, field);
        } catch {
            showToast("Failed to save", "error");
        } finally {
            setSaving(null);
        }
    };

    const handleCellKeyDown = (
        e: React.KeyboardEvent,
        memberId: string,
        field: string
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();
            saveEdit(memberId, field);
        } else if (e.key === "Escape") {
            cancelEdit(memberId, field);
        }
    };

    // ── Add Row ──────────────────────────────────────────────────────────

    const handleAddRow = () => {
        setNewRow({ ...EMPTY_ROW });
    };

    const handleNewRowChange = (field: string, value: string) => {
        setNewRow(prev => (prev ? { ...prev, [field]: value } : null));
    };

    const handleSaveNewRow = async () => {
        if (!newRow || !newRow.name.trim()) {
            showToast("Name is required", "error");
            return;
        }
        setAddingRow(true);
        try {
            const res = await fetch("/api/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newRow, team: TEAM_NAME }),
            });
            if (!res.ok) throw new Error();
            const created = await res.json();
            setMembers(prev => [created, ...prev]);
            setNewRow(null);
            showToast(`${created.name} added to ${TEAM_NAME}`);
        } catch {
            showToast("Failed to add member", "error");
        } finally {
            setAddingRow(false);
        }
    };

    const handleNewRowKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSaveNewRow();
        } else if (e.key === "Escape") {
            setNewRow(null);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await fetch(`/api/teams?id=${id}`, { method: "DELETE" });
            setMembers(prev => prev.filter(m => m.id !== id));
            showToast("Member removed");
        } catch {
            showToast("Failed to delete", "error");
        } finally {
            setDeletingId(null);
        }
    };

    // ── Excel Upload ───────────────────────────────────────────────────

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                if (jsonData.length === 0) {
                    showToast("The file is empty", "error");
                    setIsUploading(false);
                    return;
                }

                // Map Excel headers to internal keys
                // We'll look for case-insensitive matches or common variations
                const mappedMembers = jsonData.map(row => {
                    const findValue = (possibleKeys: string[]) => {
                        const key = Object.keys(row).find(k => {
                            const normalizedKey = k.toLowerCase().trim();
                            return possibleKeys.some(pk => normalizedKey.includes(pk.toLowerCase()) || pk.toLowerCase().includes(normalizedKey));
                        });
                        if (!key) return "";
                        const val = row[key];

                        // Handle Date objects from XLSX
                        if (val instanceof Date) {
                            return val.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            });
                        }
                        
                        return String(val).trim();
                    };

                    return {
                        name: findValue(["name", "nombre", "full", "empleado", "trabajador", "person", "developer"]),
                        cedula: findValue(["cedula", "documento", "dni", "id #"]),
                        position: findValue(["position", "cargo", "role", "puesto", "oficio"]),
                        startDate: findValue(["start date", "fecha inicio", "enrollment", "contratacion", "started"]),
                        increaseDue: findValue(["increase", "aumento", "proximo", "due", "5%"]),
                        email: findValue(["email", "correo", "mail", "e-mail"]),
                        leader: findValue(["leader", "reports", "jefe", "lider", "supervisor"]),
                        salary: findValue(["salary", "salario", "sueldo", "pago", "compensacion", "rate"]),
                    };
                });

                // Pre-flight validation: check if we found at least one name
                const hasNames = mappedMembers.some(m => m.name.length > 0);
                if (!hasNames) {
                    showToast("Could not find a 'Name' or 'Nombre' column. Please check your file headers.", "error");
                    setIsUploading(false);
                    return;
                }

                const res = await fetch("/api/teams/bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ members: mappedMembers }),
                });

                const result = await res.json();
                if (res.ok) {
                    if (result.inserted > 0) {
                        const skipText = result.skipped > 0 ? ` (${result.skipped} rows skipped)` : "";
                        showToast(`Successfully imported ${result.inserted} members!${skipText}`);
                        // Small delay to ensure DB transaction is visible
                        setTimeout(() => fetchMembers(), 300);
                    } else {
                        showToast(`No members were imported. Please check if your 'Name' column is filled out.`, "error");
                    }
                } else {
                    showToast(result.error || "Failed to import members", "error");
                }
            } catch (error) {
                console.error("Excel processing error:", error);
                showToast("Error processing Excel file", "error");
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };

        reader.readAsArrayBuffer(file);
    };

    // ── Export ────────────────────────────────────────────────────────────

    const handleExportCSV = () => {
        const headers = COLUMNS.map(c => c.label);
        const rows = members.map(m =>
            COLUMNS.map(c => `"${(m[c.key as keyof TeamMember] as string) || ""}"`)
        );
        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `developers_roster_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Bulk Actions ──────────────────────────────────────────────────────

    const handleToggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleToggleSelectAll = () => {
        if (selectedIds.size === members.length && members.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(members.map(m => m.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to erase ${selectedIds.size} selected members?`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch("/api/teams/bulk", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });

            if (!res.ok) throw new Error();
            const result = await res.json();
            
            showToast(`Successfully erased ${result.deleted} members!`);
            setSelectedIds(new Set());
            fetchMembers();
        } catch {
            showToast("Failed to erase members", "error");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // ── Increase‑due status ──────────────────────────────────────────────

    const getIncreaseStatus = (dateStr: string | null) => {
        if (!dateStr) return null;
        const due = new Date(dateStr);
        const diff = Math.ceil((due.getTime() - Date.now()) / 86400000);
        if (diff < 0) return "overdue";
        if (diff <= 30) return "soon";
        return "ok";
    };

    // ── Grid template ────────────────────────────────────────────────────
    const gridTemplate = `36px 40px 36px ${COLUMNS.map(c => c.width).join(" ")} 40px`;

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Code2 size={16} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Personnel Roster</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Developers</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">
                        {members.length} team member{members.length !== 1 ? "s" : ""} — all data editable inline.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="px-6 py-4 glass-premium rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2 animate-in fade-in zoom-in"
                        >
                            {isBulkDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            Erase {selectedIds.size}
                        </button>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={handleFileUpload} 
                    />
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="p-4 glass-premium rounded-2xl text-emerald-500 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                        title="Upload Excel/CSV"
                    >
                        {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="p-4 glass-premium rounded-2xl text-emerald-500 hover:bg-emerald-500/10 transition-all"
                        title="Export CSV"
                    >
                        <Download size={20} />
                    </button>
                    <button
                        onClick={handleAddRow}
                        disabled={!!newRow}
                        className="glow-button px-8 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 active:scale-95 shadow-2xl disabled:opacity-40"
                    >
                        <UserPlus size={18} />
                        Add Member
                    </button>
                </div>
            </div>

            {/* Spreadsheet */}
            <div className="glass-premium rounded-[2rem] overflow-hidden border-white/20 dark:border-white/5 shadow-2xl">
                {/* Scrollable wrapper */}
                <div className="overflow-x-auto">
                    <div className="min-w-[1100px]">
                        {/* Column Headers */}
                        <div
                            className="grid items-center bg-slate-50/90 dark:bg-slate-900/80 border-b border-emerald-500/20 select-none sticky top-0 z-10"
                            style={{ gridTemplateColumns: gridTemplate }}
                        >
                            <div className="px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">#</div>
                            <div className="px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 border-l border-slate-200/40 dark:border-white/5">Actions</div>
                            <div className="px-2 py-1.5 flex items-center justify-center border-l border-slate-200/40 dark:border-white/5">
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.size === members.length && members.length > 0} 
                                    onChange={handleToggleSelectAll}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                />
                            </div>

                            {COLUMNS.map(col => (
                                <div
                                    key={col.key}
                                    className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-l border-slate-200/40 dark:border-white/5"
                                >
                                    {col.label}
                                </div>
                            ))}
                            <div className="border-l border-slate-200/40 dark:border-white/5" />
                        </div>

                        {/* New‑Row input (appears at top like Google Sheets) */}
                        {newRow && (
                            <div
                                className="grid items-center bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-500/30 animate-in slide-in-from-top-2 duration-300"
                                style={{ gridTemplateColumns: gridTemplate }}
                            >
                                <div className="px-2 py-1 text-center">
                                    <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-[9px] font-black">+</div>
                                </div>
                                <div className="px-1 py-1 border-l border-emerald-500/10" />
                                <div className="px-1 py-1 border-l border-emerald-500/10" />
                                {COLUMNS.map((col, i) => (
                                    <div key={col.key} className="px-1 py-1 border-l border-emerald-500/10">
                                        <input
                                            ref={i === 0 ? newRowRef : undefined}
                                            className="w-full px-2 py-1 bg-white/70 dark:bg-white/5 border border-emerald-500/20 rounded text-[13px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:text-[10px] outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                                            placeholder={col.label}
                                            value={(newRow as any)[col.key] || ""}
                                            onChange={e => handleNewRowChange(col.key, e.target.value)}
                                            onKeyDown={handleNewRowKeyDown}
                                        />
                                    </div>
                                ))}
                                <div className="px-1 py-1 flex items-center gap-1 border-l border-emerald-500/10">
                                    <button
                                        onClick={handleSaveNewRow}
                                        disabled={addingRow}
                                        className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-90 disabled:opacity-50"
                                        title="Save (Enter)"
                                    >
                                        {addingRow ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    </button>
                                    <button
                                        onClick={() => setNewRow(null)}
                                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                        title="Cancel (Esc)"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Data Rows */}
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 size={28} className="animate-spin text-emerald-500" />
                            </div>
                        ) : members.length === 0 && !newRow ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600">
                                    <Users size={40} />
                                </div>
                                <p className="text-slate-500 font-bold">No developers yet. Click <strong>Add Member</strong> to get started.</p>
                            </div>
                        ) : (
                            members.map((member, idx) => {
                                const increaseStatus = getIncreaseStatus(member.increaseDue);
                                const isRowSaving = saving === member.id;
                                const isDeleting = deletingId === member.id;

                                return (
                                    <div
                                        key={member.id}
                                        className={cn(
                                            "grid items-center border-b border-slate-100 dark:border-white/5 transition-colors duration-150 group",
                                            idx % 2 === 0
                                                ? "bg-white dark:bg-white/[0.01]"
                                                : "bg-slate-50/50 dark:bg-slate-900/10",
                                            "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20",
                                            isDeleting && "opacity-40 pointer-events-none"
                                        )}
                                        style={{ gridTemplateColumns: gridTemplate }}
                                    >
                                        {/* Row number */}
                                        <div className="px-2 py-1.5 text-center text-xs font-semibold text-slate-400 tabular-nums leading-none">
                                            {idx + 1}
                                        </div>

                                        {/* Actions cell */}
                                        <div className="px-1.5 py-1 border-l border-slate-200/40 dark:border-white/5 flex items-center justify-center">
                                            {isRowSaving ? (
                                                <Loader2 size={12} className="animate-spin text-emerald-500" />
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Remove ${member.name} from ${TEAM_NAME}?`)) {
                                                            handleDelete(member.id);
                                                        }
                                                    }}
                                                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-20 group-hover:opacity-100 focus:opacity-100"
                                                    title="Remove member"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Checkbox cell */}
                                        <div className="px-1.5 py-1 border-l border-slate-200/40 dark:border-white/5 flex items-center justify-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(member.id)} 
                                                onChange={() => handleToggleSelect(member.id)}
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                            />
                                        </div>

                                        {/* Data cells */}
                                        {COLUMNS.map(col => {
                                            const fieldKey = col.key as ColumnKey;
                                            const rawValue = (member[fieldKey as keyof TeamMember] as string) || "";
                                            const editing = isEditing(member.id, fieldKey);
                                            const editValue = edits[member.id]?.[fieldKey] ?? rawValue;

                                            // Special styling for increase‑due
                                            const isSalaryCol = fieldKey === "salary";
                                            const isIncreaseCol = fieldKey === "increaseDue";

                                            return (
                                                <div
                                                    key={fieldKey}
                                                    className="px-1 py-1 border-l border-slate-200/40 dark:border-white/5 group/cell"
                                                >
                                                    {editing ? (
                                                        <input
                                                            autoFocus
                                                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded text-[13px] font-semibold text-slate-900 dark:text-white outline-none shadow-sm"
                                                            value={editValue}
                                                            onChange={e =>
                                                                updateEdit(member.id, fieldKey, e.target.value)
                                                            }
                                                            onKeyDown={e =>
                                                                handleCellKeyDown(e, member.id, fieldKey)
                                                            }
                                                            onBlur={() => saveEdit(member.id, fieldKey)}
                                                        />
                                                    ) : (
                                                        <div
                                                            onClick={() =>
                                                                startEdit(member.id, fieldKey, rawValue)
                                                            }
                                                            className={cn(
                                                                "px-2 py-1 rounded cursor-text text-[13px] font-semibold truncate transition-all",
                                                                "hover:bg-white/60 dark:hover:bg-white/5 hover:ring-1 hover:ring-emerald-500/20",
                                                                isIncreaseCol && increaseStatus === "overdue" && "text-rose-500",
                                                                isIncreaseCol && increaseStatus === "soon" && "text-amber-500",
                                                                isSalaryCol && "text-emerald-600 dark:text-emerald-400 font-bold",
                                                                !rawValue && "text-slate-300 dark:text-slate-600 italic"
                                                            )}
                                                            title={rawValue || "Click to edit"}
                                                        >
                                                            {isSalaryCol && rawValue ? `$${rawValue}` : rawValue || "—"}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div className="border-l border-slate-200/40 dark:border-white/5 h-full" />
                                    </div>
                                );
                            })
                        )}

                        {/* Footer row (member count) */}
                        {members.length > 0 && (
                            <div
                                className="grid items-center bg-slate-50/60 dark:bg-slate-900/40 border-t-2 border-slate-200/80 dark:border-white/10"
                                style={{ gridTemplateColumns: gridTemplate }}
                            >
                                    <div className="px-3 py-3 text-center text-[10px] font-black text-slate-400" />
                                    <div className="border-l border-slate-200/40 dark:border-white/5" />
                                    <div className="border-l border-slate-200/40 dark:border-white/5" />
                                    <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 col-span-1 border-l border-slate-200/40 dark:border-white/5">
                                        {members.length} member{members.length !== 1 ? "s" : ""}
                                    </div>
                                {/* Empty cells for remaining columns */}
                                {COLUMNS.slice(1).map(col => (
                                    <div key={col.key} className="border-l border-slate-200/40 dark:border-white/5" />
                                ))}
                                <div className="border-l border-slate-200/40 dark:border-white/5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Keyboard Hints */}
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-2">
                <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[9px] font-mono border border-slate-200 dark:border-white/10">Click</kbd>
                    Edit cell
                </span>
                <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[9px] font-mono border border-slate-200 dark:border-white/10">Enter</kbd>
                    Save
                </span>
                <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[9px] font-mono border border-slate-200 dark:border-white/10">Esc</kbd>
                    Cancel
                </span>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={cn(
                        "fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm animate-in slide-in-from-bottom-4 fade-in duration-300",
                        toast.type === "success"
                            ? "bg-emerald-500 text-white shadow-emerald-500/30"
                            : "bg-rose-500 text-white shadow-rose-500/30"
                    )}
                >
                    {toast.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
}
