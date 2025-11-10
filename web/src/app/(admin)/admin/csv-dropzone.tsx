"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
} from "react";

type CsvDropzoneProps = {
  name?: string;
  accept?: string;
  required?: boolean;
};

export function CsvDropzone({
  name = "csv",
  accept = ".csv",
  required = true,
}: CsvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetDrag = useCallback(() => setIsDragging(false), []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const updateInputFiles = useCallback((file: File | null) => {
    const input = inputRef.current;
    if (!input) return;

    if (!file) {
      input.value = "";
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
  }, []);

  const handleFile = useCallback(
    (file: File | null, syncInput = false) => {
      if (!file) {
        setFileName(null);
        setError(null);
        if (syncInput) {
          updateInputFiles(null);
        }
        return;
      }

      const lowerName = file.name.toLowerCase();
      const acceptsCsv =
        lowerName.endsWith(".csv") ||
        (file.type === "text/csv" && (!accept || accept.includes(".csv")));

      if (!acceptsCsv) {
        setError("Please upload a CSV file (.csv).");
        setFileName(null);
        if (syncInput) {
          updateInputFiles(null);
        }
        return;
      }

      setError(null);
      setFileName(file.name);
      if (syncInput) {
        updateInputFiles(file);
      }
    },
    [accept, updateInputFiles],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resetDrag();
  }, [resetDrag]);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      resetDrag();

      const file = event.dataTransfer.files?.[0] ?? null;
      handleFile(file, true);
    },
    [handleFile, resetDrag],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      handleFile(file);
    },
    [handleFile],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFileDialog();
      }
    },
    [openFileDialog],
  );

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="sr-only"
        onChange={handleInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={openFileDialog}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition",
          isDragging
            ? "border-emerald-400/80 bg-emerald-500/10 text-emerald-200"
            : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-emerald-400/60 hover:bg-slate-900/60",
        ].join(" ")}
        aria-label="Upload CSV file"
      >
        <span className="text-sm font-semibold text-white">
          Drop CSV file here or click to browse
        </span>
        <span className="mt-2 text-xs text-slate-400">
          {fileName ?? "Only .csv files are supported"}
        </span>
      </div>

      <div className="text-xs text-emerald-300" aria-live="polite">
        {fileName}
      </div>
      {error ? (
        <div className="text-xs text-red-400" aria-live="assertive">
          {error}
        </div>
      ) : null}
    </div>
  );
}

