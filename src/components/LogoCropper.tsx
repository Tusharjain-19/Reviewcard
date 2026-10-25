import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LogoCropper({
  source,
  onClose,
  onSave,
}: {
  source: string;
  onClose: () => void;
  onSave: (logo: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area>();
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!area) return;
    setSaving(true);
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, 480, 480);
      onSave(canvas.toDataURL("image/png"));
    } catch {
      toast.error("Couldn't crop that logo. Please try another image.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined} className="max-w-lg">
        <DialogTitle>Crop logo</DialogTitle>
        <div className="relative h-72 overflow-hidden rounded-md bg-muted">
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </div>
        <Label htmlFor="crop-zoom">Zoom</Label>
        <Input
          id="crop-zoom"
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!area || saving} onClick={save}>
            {saving ? "Saving…" : "Apply crop"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
