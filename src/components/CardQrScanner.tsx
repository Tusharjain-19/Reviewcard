import { useEffect, useRef, useState } from "react";
import {
  Camera,
  FlipHorizontal,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CardQrScannerProps {
  onScanSuccess: (code: string) => void;
  onCancel?: () => void;
}

export function parseCardCode(rawText: string): string | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("/")) {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const idParam = url.searchParams.get("id") || url.searchParams.get("code");
      if (idParam) return idParam.trim().toLowerCase();

      const segments = url.pathname.split("/").filter(Boolean);
      const seg0 = segments[0];
      const seg1 = segments[1];
      if (
        segments.length >= 2 &&
        seg0 &&
        seg1 &&
        (seg0 === "activate" || seg0 === "r" || seg0 === "cards" || seg0 === "nfc")
      ) {
        return seg1.trim().toLowerCase();
      }
      if (segments.length === 1 && seg0 && seg0 !== "activate") {
        return seg0.trim().toLowerCase();
      }
    }
  } catch {
    // URL parsing failed, fall back to string regex match
  }

  const match = trimmed.match(/[a-zA-Z0-9_-]{3,50}/);
  return match ? match[0].toLowerCase() : null;
}

function playBeep() {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio context autoplay limitations
  }
}

import type { Html5Qrcode } from "html5-qrcode";

export function CardQrScanner({ onScanSuccess, onCancel }: CardQrScannerProps) {
  const containerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`).current;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted) return;

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        // Check cameras
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setHasCamera(false);
          setCameraError("No camera found on this device.");
          return;
        }

        setHasCamera(true);
        await scanner.start(
          { facingMode },
          {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minDim = Math.min(viewfinderWidth, viewfinderHeight);
              return {
                width: Math.floor(minDim * 0.72),
                height: Math.floor(minDim * 0.72),
              };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            const parsed = parseCardCode(decodedText);
            if (parsed) {
              playBeep();
              setScannedCode(parsed);
              setIsScanning(false);
              void scanner.stop().catch(() => {});
              toast.success(`Card #${parsed.toUpperCase()} scanned!`);
              setTimeout(() => {
                onScanSuccess(parsed);
              }, 400);
            }
          },
          () => {
            // Frame scan failure, normal behavior while scanning
          },
        );

        if (isMounted) {
          setIsScanning(true);
          setCameraError(null);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Camera scanner error:", err);
        const errRecord = err as { name?: string; message?: string } | null;
        setCameraError(
          errRecord?.name === "NotAllowedError" || errRecord?.message?.includes("Permission")
            ? "Camera permission denied. Please allow camera access in your browser settings, or enter the code manually."
            : "Could not access the camera. You can still enter your Card ID manually below.",
        );
        setIsScanning(false);
      }
    }

    void initScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            void scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch {
          // cleanup
        }
      }
    };
  }, [containerId, facingMode, onScanSuccess]);

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    try {
      const decoded = await scannerRef.current.scanFile(file, true);
      const parsed = parseCardCode(decoded);
      if (parsed) {
        playBeep();
        setScannedCode(parsed);
        toast.success(`Card #${parsed.toUpperCase()} detected from image!`);
        setTimeout(() => {
          onScanSuccess(parsed);
        }, 400);
      } else {
        toast.error("Could not find a valid ReviewCard QR code in this image");
      }
    } catch {
      toast.error(
        "Could not read QR code from the uploaded photo. Please try a clearer picture or enter code manually.",
      );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
      {/* Top Controls Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-linear-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-slate-200">
            Live Card Scanner
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleFlipCamera}
            className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
            title="Switch Camera"
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
            title="Upload photo with QR code"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Camera Video Viewport */}
      <div className="relative flex flex-col items-center justify-center min-h-85 bg-black">
        <div id={containerId} className="w-full h-full max-w-105" />

        {/* Viewfinder Target Reticle Overlay */}
        {isScanning && !scannedCode && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-60 w-60 rounded-2xl border-2 border-white/20">
              {/* Animated Corner Brackets */}
              <div className="absolute -top-1 -left-1 h-6 w-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 h-6 w-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

              {/* Scanning Laser Guide */}
              <div className="absolute inset-x-2 top-0 h-0.5 bg-linear-to-r from-transparent via-blue-400 to-transparent animate-bounce opacity-80" />
            </div>
          </div>
        )}

        {/* Success Confirmation Animation */}
        {scannedCode && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-emerald-950/90 backdrop-blur-xs p-6 text-center animate-in fade-in duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-white">Card Detected!</h3>
            <p className="mt-1 font-mono text-sm font-semibold tracking-wider text-emerald-300 uppercase">
              ID: #{scannedCode}
            </p>
            <p className="mt-2 text-xs text-emerald-200">Opening card activation...</p>
          </div>
        )}

        {/* Camera Error / Permission Fallback */}
        {cameraError && (
          <div className="p-6 text-center max-w-sm space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                Upload Photo Instead
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint Banner */}
      <div className="p-3 text-center bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400">
        Hold your phone camera steady over the QR code on the card.
      </div>
    </div>
  );
}
