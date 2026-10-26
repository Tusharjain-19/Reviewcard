import { supabase } from "@/integrations/supabase/client";
import type { Business } from "./reviewcard";

export async function uploadBusinessMedia(b: Business): Promise<Business> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in before saving");
  const next = { ...b };
  for (const [field, pathField] of [
    ["logo", "logoPath"],
    ["logoOriginal", "logoOriginalPath"],
    ["cover", "coverPath"],
  ] as const) {
    const source = b[field];
    if (!source) {
      delete next[pathField];
      continue;
    }
    if (!source.startsWith("data:")) continue;
    const blob = await (await fetch(source)).blob();
    const path = `${data.user.id}/${crypto.randomUUID()}.${blob.type === "image/jpeg" ? "jpg" : "png"}`;
    try {
      const result = await supabase.storage
        .from("business-media")
        .upload(path, blob, { contentType: blob.type });
      if (!result.error) {
        next[pathField] = path;
      } else {
        console.warn(
          "Storage upload warning, using compressed inline image:",
          result.error.message,
        );
      }
    } catch (e) {
      console.warn("Storage upload fallback to compressed inline image:", e);
    }
  }
  return next;
}
