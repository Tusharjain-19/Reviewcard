# Project Rules

- ReviewCard types and pure validation live in src/lib/reviewcard.ts; Cloud business access is centralized in businesses.functions.ts and old local storage is legacy-only.
- Keep button ordering and destination normalization in the ReviewCard data module; editor and public page must share these rules.
- Use react-easy-crop for browser-side logo cropping and preserve a resized original for re-editing without cumulative cropping.
- Use dnd-kit with keyboard sorting and arrow alternatives so ordering works with mouse, touch and keyboard.
- Scope user-selected appearance through business-page CSS tokens so custom pages do not recolour the editor.
- Keep account tools under the client-authenticated pathless layout; every private server function separately validates the caller and applies ownership policies.
- Business slugs are immutable and archive replaces deletion; this preserves printed URLs and keeps reserved addresses from reassignment.
- Business media is stored in a private bucket; public access policies expose only published logo/cover paths, never crop originals.
- Use react-konva only through a client-only lazy import and pdf-lib for physical-size print exports; print geometry lives in millimetres in src/lib/print.ts.
