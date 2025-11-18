"use client";

import { useEffect, useMemo, useState } from "react";

export interface VoteOption {
  id: string;
  label: string;
  count: number;
}

interface VoteChipsProps {
  label: string;
  storageKey: string;
  initialOptions: VoteOption[];
  onVote?: (optionId: string) => void;
  helperText?: string;
}

const isBrowser = typeof window !== "undefined";

export function VoteChips({ label, storageKey, initialOptions, onVote, helperText }: VoteChipsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored && initialOptions.some((option) => option.id === stored)) {
        setSelectedId(stored);
      } else {
        setSelectedId(null);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialOptions, storageKey]);

  const computedOptions = useMemo(() => {
    return initialOptions.map((option) => ({
      ...option,
      displayCount: option.count + (selectedId === option.id ? 1 : 0),
    }));
  }, [initialOptions, selectedId]);

  const maxCount = useMemo(
    () => Math.max(...computedOptions.map((option) => option.displayCount)),
    [computedOptions]
  );
  const summaries = useMemo(
    () =>
      computedOptions.map((option) => {
        const count = option.displayCount;
        const noun = count === 1 ? "person" : "people";
        return `${count} ${noun} voted ${option.label.toLowerCase()} today`;
      }),
    [computedOptions]
  );

  const handleVote = (optionId: string) => {
    if (!isBrowser) return;

    setSelectedId((current) => {
      if (current === optionId) {
        window.sessionStorage.removeItem(storageKey);
        onVote?.("reset");
        console.info(`[vote] ${label} -> reset ${optionId}`);
        return null;
      }

      window.sessionStorage.setItem(storageKey, optionId);
      onVote?.(optionId);
      console.info(`[vote] ${label} -> ${optionId}`);
      return optionId;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {computedOptions.map((option) => {
          const isLeader = option.displayCount === maxCount && option.displayCount > 0;
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isLeader
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
              } ${isSelected ? "ring-2 ring-emerald-200" : ""}`}
            >
              <span>{option.label}</span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-slate-500">
                {option.displayCount}
              </span>
            </button>
          );
        })}
      </div>
      <div className="text-xs text-slate-500">
        {summaries.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

