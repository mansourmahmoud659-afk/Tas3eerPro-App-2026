/**
 * سجل الحسابات — يُخزَّن محلياً في LocalStorage (بدون سيرفر أو إنترنت).
 */

export type HistoryEntry = {
  id: string;
  tool: string;
  toolKey: string;
  createdAt: number;
  inputs: { label: string; value: string }[];
  results: { label: string; value: string }[];
  status?: string;
};

const KEY = "spp.history.v1";
const DRAFT_KEY = "spp.drafts.v1";
const MAX = 200;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse<HistoryEntry[]>(window.localStorage.getItem(KEY), []);
}

export function saveEntry(entry: Omit<HistoryEntry, "id" | "createdAt">): HistoryEntry[] {
  const list = loadHistory();
  const full: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const next = [full, ...list].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteEntry(id: string): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): HistoryEntry[] {
  window.localStorage.removeItem(KEY);
  return [];
}

/* ------------------------- استرجاع البيانات تلقائياً ------------------------ */

export function loadDraft<T>(toolKey: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const all = safeParse<Record<string, T>>(window.localStorage.getItem(DRAFT_KEY), {});
  return all[toolKey] ?? fallback;
}

export function saveDraft<T>(toolKey: string, data: T): void {
  if (typeof window === "undefined") return;
  const all = safeParse<Record<string, unknown>>(window.localStorage.getItem(DRAFT_KEY), {});
  all[toolKey] = data;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
}

export function clearDraft(toolKey: string): void {
  if (typeof window === "undefined") return;
  const all = safeParse<Record<string, unknown>>(window.localStorage.getItem(DRAFT_KEY), {});
  delete all[toolKey];
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
