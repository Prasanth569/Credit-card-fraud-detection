import { useState, useRef, useCallback } from "react";
import { batchPredict, type BatchResult } from "../../api/batch";

interface BatchUploadPanelProps {
  onComplete?: (result: BatchResult) => void;
}

type UploadStage = "idle" | "parsing" | "uploading" | "complete" | "error";

export default function BatchUploadPanel({ onComplete }: BatchUploadPanelProps) {
  const [stage, setStage] = useState<UploadStage>("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStage("idle");
    setProgress(0);
    setResult(null);
    setError("");
    setFileName("");
    setTotalRows(0);
    setProcessedRows(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const processCSV = useCallback(async (file: File) => {
    setFileName(file.name);
    setStage("parsing");
    setProgress(5);

    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      const header = lines[0].toLowerCase();
      const cols = header.split(",");
      const amountIdx = cols.findIndex((h) => h.trim() === "amount");
      const timeIdx = cols.findIndex((h) => h.trim() === "time");

      const transactions = lines
        .slice(1)
        .map((line) => {
          const c = line.split(",");
          return {
            amount: parseFloat(c[amountIdx >= 0 ? amountIdx : 0]) || 0,
            time: parseFloat(c[timeIdx >= 0 ? timeIdx : 1]) || 0,
          };
        })
        .filter((t) => t.amount > 0);

      if (transactions.length === 0) throw new Error("No valid transactions found in CSV");

      const total = Math.min(transactions.length, 500);
      setTotalRows(total);
      setProgress(15);
      setStage("uploading");

      // Simulate chunked progress for visual feedback
      const CHUNK_SIZE = 50;
      const chunks = [];
      for (let i = 0; i < total; i += CHUNK_SIZE) {
        chunks.push(transactions.slice(i, i + CHUNK_SIZE));
      }

      // Actually send all at once (backend handles it), but animate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 3, 85));
      }, 200);

      const batchResult = await batchPredict(transactions.slice(0, 500));

      clearInterval(progressInterval);
      setProgress(100);
      setProcessedRows(batchResult.processed);
      setResult(batchResult);
      setStage("complete");
      onComplete?.(batchResult);
    } catch (err: any) {
      setError(err?.message || "Failed to process CSV file");
      setStage("error");
    }
  }, [onComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      processCSV(file);
    } else {
      setError("Please upload a .csv file");
      setStage("error");
    }
  }, [processCSV]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCSV(file);
  };

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[18px]">cloud_upload</span>
          </div>
          <div>
            <h3 className="text-sm font-black font-headline text-on-surface">Batch Upload</h3>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              CSV · Max 500 transactions
            </p>
          </div>
        </div>
        {stage !== "idle" && (
          <button
            onClick={resetState}
            className="text-xs font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            Reset
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Idle / Drag-and-Drop Zone */}
        {stage === "idle" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
              transition-all duration-300 group
              ${isDragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-outline-variant/50 hover:border-primary/40 hover:bg-neutral/50"}`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300
              ${isDragOver ? "bg-primary/15 scale-110" : "bg-neutral group-hover:bg-primary/10"}`}>
              <span className={`material-symbols-outlined text-3xl transition-all duration-300
                ${isDragOver ? "text-primary" : "text-on-surface-variant group-hover:text-primary"}`}>
                upload_file
              </span>
            </div>

            <p className="text-sm font-bold text-on-surface mb-1">
              {isDragOver ? "Drop your CSV here" : "Drag & drop your CSV file"}
            </p>
            <p className="text-xs text-on-surface-variant">
              or <span className="text-primary font-semibold hover:underline">click to browse</span>
            </p>

            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">description</span>
                .csv format
              </span>
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">table_rows</span>
                Max 500 rows
              </span>
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">view_column</span>
                amount, time columns
              </span>
            </div>
          </div>
        )}

        {/* Parsing/Uploading Progress */}
        {(stage === "parsing" || stage === "uploading") && (
          <div className="py-6 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px] animate-spin" style={{ animationDuration: "2s" }}>
                    sync
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{fileName}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    {stage === "parsing" ? "Parsing CSV…" : `Processing ${totalRows} transactions…`}
                  </p>
                </div>
              </div>
              <span className="text-xl font-black font-headline text-primary">{Math.round(progress)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-neutral rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #0052CC 0%, #4C9AFF 100%)",
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-on-surface-variant">
                {stage === "uploading" && processedRows > 0
                  ? `${processedRows} / ${totalRows} processed`
                  : "Preparing batch…"}
              </p>
              <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                In progress
              </p>
            </div>
          </div>
        )}

        {/* Complete */}
        {stage === "complete" && result && (
          <div className="py-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center">
                <span className="material-symbols-outlined text-success text-[20px]">check_circle</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Batch Processing Complete</p>
                <p className="text-[10px] text-on-surface-variant">{fileName} — {result.processed} transactions analyzed</p>
              </div>
            </div>

            {/* Result Stats  */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Processed", value: result.processed, color: "text-on-surface", bg: "bg-neutral" },
                { label: "Legit", value: result.legitCount, color: "text-success", bg: "bg-success-light" },
                { label: "Flagged", value: result.flagCount, color: "text-warning", bg: "bg-warning-light" },
                { label: "Fraud", value: result.fraudCount, color: "text-danger", bg: "bg-danger-light" },
                { label: "Fraud Rate", value: `${result.fraudRate}%`, color: "text-danger", bg: "bg-danger-light" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                    {label}
                  </p>
                  <p className={`text-xl font-black font-headline ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Fraud breakdown bar */}
            <div className="mt-4">
              <div className="flex h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-success transition-all"
                  style={{ width: `${(result.legitCount / result.processed) * 100}%` }}
                  title={`Legit: ${result.legitCount}`}
                />
                <div
                  className="bg-warning transition-all"
                  style={{ width: `${(result.flagCount / result.processed) * 100}%` }}
                  title={`Flagged: ${result.flagCount}`}
                />
                <div
                  className="bg-danger transition-all"
                  style={{ width: `${(result.fraudCount / result.processed) * 100}%` }}
                  title={`Fraud: ${result.fraudCount}`}
                />
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                {[
                  { label: "Legit", color: "bg-success" },
                  { label: "Flagged", color: "bg-warning" },
                  { label: "Fraud", color: "bg-danger" },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {stage === "error" && (
          <div className="py-6 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-danger-light mx-auto mb-3 flex items-center justify-center">
              <span className="material-symbols-outlined text-danger text-2xl">error</span>
            </div>
            <p className="text-sm font-bold text-danger mb-1">Upload Failed</p>
            <p className="text-xs text-on-surface-variant mb-4">{error}</p>
            <button
              onClick={resetState}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
