export default function CertBadges() {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
          <path d="M7 3l-3 3" />
          <path d="M17 3l3 3" />
        </svg>
        <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap">
          ISO 27001
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap">
          ISO 9001
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l2.5 1.5" />
          <path d="M8 3L5 6" />
          <path d="M16 3l3 3" />
          <path d="M9 16l4 2" />
          <path d="M6 9l-2 4" />
          <path d="M20 9l-3 2" />
        </svg>
        <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap">
          ISO 13485
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l2 2 4-4" />
        </svg>
        <span className="text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap">
          CE
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 12l2 2 4-4" />
          <path d="M7 8h10" />
          <path d="M7 16h8" />
        </svg>
        <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap">
          GDPR
        </span>
      </div>
    </div>
  );
}
