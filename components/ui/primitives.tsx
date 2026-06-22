'use client';

import React from "react";
import { X } from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────
// Editöryel UI primitifleri — TEK KAYNAK.
// (Önceden app/page.tsx içinde inline tanımlıydı; tasarım dili buradan yönetilir.)
// Not: shadcn tabanlı components/ui/button|card|label ayrı bir (jenerik) settir;
// uygulamanın editöryel görünümü bu dosyadaki primitiflerle kurulur.
// ──────────────────────────────────────────────────────────────────────────

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" | "danger"; size?: "sm" | "md" }> =
  ({ variant = "primary", size = "md", className, ...p }) => (
    <button {...p} className={cx(
      "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
      size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
      variant === "primary" && "bg-[#0E0F12] text-white hover:bg-[#1A1B22]",
      variant === "ghost" && "text-gray-600 hover:bg-gray-100",
      variant === "outline" && "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
      variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
      className,
    )} />
  );

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...p }) =>
  <input {...p} className={cx("h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors", className)} />;

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...p }) =>
  <textarea {...p} className={cx("min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0E0F12] transition-colors", className)} />;

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...p }) =>
  <div {...p} className={cx("card p-5", className)} />;

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...p }) =>
  <label {...p} className={cx("text-xs font-semibold text-gray-500 uppercase tracking-wide", className)} />;

export const Badge: React.FC<{ tone?: "slate" | "amber" | "red" | "green" | "blue"; children: React.ReactNode }> = ({ tone = "slate", children }) => {
  const map = {
    slate: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
  } as const;
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
};

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={cx("w-full rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-[#0E0F12]">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
