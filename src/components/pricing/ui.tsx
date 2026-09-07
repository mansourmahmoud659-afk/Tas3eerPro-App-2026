import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Analysis, Status } from "@/lib/pricing";
import {
  IconAlert,
  IconCheck,
  IconCopy,
  IconPdf,
  IconPrint,
  IconReset,
  IconSave,
} from "./icons";

/* --------------------------------- Field ---------------------------------- */

export function Field({
  label,
  value,
  onChange,
  suffix = "ج.م",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className="relative flex items-center">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="num h-12 w-full rounded-xl border border-input bg-secondary/40 px-4 pl-14 text-base font-semibold text-foreground outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-secondary/60 focus:ring-4 focus:ring-primary/15"
          dir="ltr"
        />
        <span className="pointer-events-none absolute left-3 text-xs font-medium text-muted-foreground">
          {suffix}
        </span>
      </span>
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground/80">{hint}</span> : null}
    </label>
  );
}

/* ------------------------------- Result card ------------------------------ */

export function Result({
  label,
  value,
  tone = "default",
  big,
}: {
  label: string;
  value: string;
  tone?: "default" | "primary" | "success" | "danger" | "warning";
  big?: boolean;
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    danger: "text-destructive",
    warning: "text-warning",
  }[tone];

  return (
    <div
      className={cn(
        "glass rounded-2xl px-4 py-3.5",
        big && "bg-primary/5 ring-1 ring-primary/25",
      )}
    >
      <div className="text-[12px] font-medium text-muted-foreground">{label}</div>
      <div
        className={cn("num mt-1 font-extrabold", big ? "text-2xl sm:text-3xl" : "text-xl", toneClass)}
        dir="ltr"
      >
        {value}
      </div>
    </div>
  );
}

/* ----------------------------- Analysis banner ---------------------------- */

const statusStyles: Record<Status, { bg: string; text: string; ring: string }> = {
  excellent: { bg: "bg-success/12", text: "text-success", ring: "ring-success/35" },
  good: { bg: "bg-primary/12", text: "text-primary", ring: "ring-primary/35" },
  warning: { bg: "bg-warning/12", text: "text-warning", ring: "ring-warning/35" },
  loss: { bg: "bg-destructive/12", text: "text-destructive", ring: "ring-destructive/35" },
};

export function AnalysisCard({ analysis }: { analysis: Analysis }) {
  const s = statusStyles[analysis.status];
  const Icon = analysis.status === "excellent" || analysis.status === "good" ? IconCheck : IconAlert;
  return (
    <div className={cn("fade-up rounded-2xl p-4 ring-1", s.bg, s.ring)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-5 w-5", s.text)} />
        <span className={cn("text-lg font-extrabold", s.text)}>{analysis.label}</span>
        <span className="text-xs text-muted-foreground">التحليل الذكي</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{analysis.reason}</p>
      <ul className="mt-3 space-y-1.5">
        {analysis.tips.map((t) => (
          <li key={t} className="flex items-start gap-2 text-[13px] text-muted-foreground">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", s.text, "bg-current")} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- Buttons -------------------------------- */

export function ActionButton({
  children,
  onClick,
  icon,
  variant = "ghost",
}: {
  children: ReactNode;
  onClick: () => void;
  icon: ReactNode;
  variant?: "ghost" | "primary" | "danger";
}) {
  const styles = {
    ghost:
      "border border-border bg-secondary/40 text-foreground hover:border-primary/50 hover:bg-secondary/70",
    primary:
      "border border-primary/40 bg-primary/15 text-primary hover:bg-primary/25",
    danger:
      "border border-destructive/40 bg-destructive/12 text-destructive hover:bg-destructive/22",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold transition-all active:scale-[0.97]",
        styles,
      )}
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {children}
    </button>
  );
}

export function ToolActions({
  onCopy,
  onSave,
  onReset,
}: {
  onCopy: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      <ActionButton onClick={onSave} icon={<IconSave />} variant="primary">
        حفظ في السجل
      </ActionButton>
      <ActionButton onClick={onCopy} icon={<IconCopy />}>
        نسخ النتائج
      </ActionButton>
      <ActionButton onClick={() => window.print()} icon={<IconPrint />}>
        طباعة
      </ActionButton>
      <ActionButton onClick={() => window.print()} icon={<IconPdf />}>
        حفظ PDF
      </ActionButton>
      <ActionButton onClick={onReset} icon={<IconReset />} variant="danger">
        تصفير
      </ActionButton>
    </div>
  );
}

/* --------------------------------- Toast ---------------------------------- */

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function show(msg: string) {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }

  const node = message ? (
    <div className="no-print pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="fade-up glass flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground">
        <IconCheck className="h-4 w-4 text-success" />
        {message}
      </div>
    </div>
  ) : null;

  return { show, node };
}

/* -------------------------------- Sections -------------------------------- */

export function ToolPanel({
  title,
  description,
  inputs,
  results,
}: {
  title: string;
  description: string;
  inputs: ReactNode;
  results: ReactNode;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className="glass rounded-3xl p-5">
        <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{inputs}</div>
      </section>
      <section className="print-area space-y-4">{results}</section>
    </div>
  );
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);
}

function fallbackCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    /* ignore */
  }
  document.body.removeChild(ta);
}
