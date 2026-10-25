import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isHexColor } from "@/lib/reviewcard";

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const id = `color-${label.toLowerCase().replace(/\s/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          aria-label={`${label} picker`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer p-1"
        />
        <Input
          id={id}
          value={draft}
          placeholder="#123456"
          maxLength={7}
          aria-invalid={!isHexColor(draft)}
          className="min-w-0 font-mono"
          onChange={(e) => {
            setDraft(e.target.value);
            if (isHexColor(e.target.value)) onChange(e.target.value);
          }}
        />
      </div>
      {!isHexColor(draft) && <p className="text-xs text-destructive">Use # and six hex digits.</p>}
    </div>
  );
}
