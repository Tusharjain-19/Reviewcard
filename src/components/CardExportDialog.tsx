import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Layers, Grid2X2, Scissors, Download, Check } from "lucide-react";
import type { ExportCardPdfOptions } from "@/lib/print";

export interface CardExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: {
    copies: number;
    layout: "a6-single" | "a4-2cards" | "a4-4cards";
    showCutGuidelines: boolean;
  }) => Promise<void>;
  exporting: boolean;
  businessName: string;
}

export function CardExportDialog({
  open,
  onOpenChange,
  onExport,
  exporting,
  businessName,
}: CardExportDialogProps) {
  const [layout, setLayout] = useState<"a6-single" | "a4-2cards" | "a4-4cards">("a6-single");
  const [copies, setCopies] = useState<number>(1);
  const [showCutGuidelines, setShowCutGuidelines] = useState<boolean>(true);

  const handleSelectLayout = (l: "a6-single" | "a4-2cards" | "a4-4cards") => {
    setLayout(l);
    if (l === "a6-single" && copies > 4) {
      setCopies(1);
    } else if (l === "a4-2cards" && copies === 1) {
      setCopies(2);
    } else if (l === "a4-4cards" && copies === 1) {
      setCopies(4);
    }
  };

  const handleConfirm = async () => {
    await onExport({
      copies,
      layout,
      showCutGuidelines,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-5 sm:p-6 rounded-2xl bg-white shadow-2xl border border-slate-200">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                Print & Export PDF
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Choose page size, card quantity, and cutting guidelines for {businessName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1. Page Size & Card Layout */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              1. Choose Page & Print Layout
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: A6 Single Card */}
              <button
                type="button"
                onClick={() => handleSelectLayout("a6-single")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  layout === "a6-single"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <FileText
                      className={`h-4 w-4 ${layout === "a6-single" ? "text-blue-600" : "text-slate-400"}`}
                    />
                    {layout === "a6-single" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </div>
                  <p className="mt-2 text-xs font-bold">1 Card / A6</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">105 × 148 mm</p>
                </div>
                <span className="mt-2 text-[9px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded text-center">
                  True Card Size
                </span>
              </button>

              {/* Option 2: 2 Cards on A4 */}
              <button
                type="button"
                onClick={() => handleSelectLayout("a4-2cards")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  layout === "a4-2cards"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Layers
                      className={`h-4 w-4 ${layout === "a4-2cards" ? "text-blue-600" : "text-slate-400"}`}
                    />
                    {layout === "a4-2cards" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </div>
                  <p className="mt-2 text-xs font-bold">2 Cards / A4</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">210 × 297 mm Sheet</p>
                </div>
                <span className="mt-2 text-[9px] font-semibold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded text-center">
                  2 per page
                </span>
              </button>

              {/* Option 3: 4 Cards on A4 */}
              <button
                type="button"
                onClick={() => handleSelectLayout("a4-4cards")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  layout === "a4-4cards"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Grid2X2
                      className={`h-4 w-4 ${layout === "a4-4cards" ? "text-blue-600" : "text-slate-400"}`}
                    />
                    {layout === "a4-4cards" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </div>
                  <p className="mt-2 text-xs font-bold">4 Cards / A4</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">2 × 2 Grid Sheet</p>
                </div>
                <span className="mt-2 text-[9px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded text-center">
                  Max Paper Yield
                </span>
              </button>
            </div>
          </div>

          {/* 2. Number of Copies */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Total Cards to Print
              </label>
              <span className="font-mono text-xs font-bold text-blue-600">
                {copies} {copies === 1 ? "card" : "cards"} (
                {layout === "a6-single"
                  ? `${copies} A6 pages`
                  : layout === "a4-2cards"
                    ? `${Math.ceil(copies / 2)} A4 sheets`
                    : `${Math.ceil(copies / 4)} A4 sheets`}
                )
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-1">
                {[1, 2, 4, 8, 12, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCopies(num)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer text-center ${
                      copies === num
                        ? "bg-slate-900 border-slate-900 text-white shadow-xs font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Stepper Input */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                  className="px-2 py-0.5 text-slate-600 hover:text-slate-900 font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={copies}
                  onChange={(e) =>
                    setCopies(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))
                  }
                  className="w-9 text-center font-mono text-xs bg-transparent border-0 focus:outline-none font-bold"
                />
                <button
                  type="button"
                  onClick={() => setCopies((c) => Math.min(50, c + 1))}
                  className="px-2 py-0.5 text-slate-600 hover:text-slate-900 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 3. Guidelines & Bleed Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-slate-500" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Show Cutting Guidelines
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Dashed trim lines to easily cut with scissors or guillotine.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showCutGuidelines}
                onChange={(e) => setShowCutGuidelines(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={exporting}
            className="text-xs h-9 font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" />
            {exporting
              ? "Generating PDF…"
              : `Download PDF (${copies} ${copies === 1 ? "Card" : "Cards"})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
