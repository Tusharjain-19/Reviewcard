export interface FontOption {
  name: string;
  value: string;
  category: "sans" | "serif" | "display" | "handwriting" | "mono";
}

export const CANVA_FONTS: FontOption[] = [
  // 1. Modern Sans-Serif (40 fonts)
  { name: "Open Sans", value: "Open Sans, sans-serif", category: "sans" },
  { name: "Inter", value: "Inter, sans-serif", category: "sans" },
  { name: "Roboto", value: "Roboto, sans-serif", category: "sans" },
  { name: "Outfit", value: "Outfit, sans-serif", category: "sans" },
  { name: "Plus Jakarta Sans", value: "Plus Jakarta Sans, sans-serif", category: "sans" },
  { name: "Poppins", value: "Poppins, sans-serif", category: "sans" },
  { name: "Montserrat", value: "Montserrat, sans-serif", category: "sans" },
  { name: "Lato", value: "Lato, sans-serif", category: "sans" },
  { name: "Raleway", value: "Raleway, sans-serif", category: "sans" },
  { name: "Nunito", value: "Nunito, sans-serif", category: "sans" },
  { name: "Rubik", value: "Rubik, sans-serif", category: "sans" },
  { name: "Work Sans", value: "Work Sans, sans-serif", category: "sans" },
  { name: "DM Sans", value: "DM Sans, sans-serif", category: "sans" },
  { name: "Manrope", value: "Manrope, sans-serif", category: "sans" },
  { name: "Sora", value: "Sora, sans-serif", category: "sans" },
  { name: "Quicksand", value: "Quicksand, sans-serif", category: "sans" },
  { name: "Urbanist", value: "Urbanist, sans-serif", category: "sans" },
  { name: "Figtree", value: "Figtree, sans-serif", category: "sans" },
  { name: "Public Sans", value: "Public Sans, sans-serif", category: "sans" },
  { name: "Cabin", value: "Cabin, sans-serif", category: "sans" },
  { name: "Overpass", value: "Overpass, sans-serif", category: "sans" },
  { name: "Lexend", value: "Lexend, sans-serif", category: "sans" },
  { name: "Albert Sans", value: "Albert Sans, sans-serif", category: "sans" },
  { name: "Spline Sans", value: "Spline Sans, sans-serif", category: "sans" },
  { name: "Onest", value: "Onest, sans-serif", category: "sans" },
  { name: "Readex Pro", value: "Readex Pro, sans-serif", category: "sans" },
  { name: "Schibsted Grotesk", value: "Schibsted Grotesk, sans-serif", category: "sans" },
  { name: "Be Vietnam Pro", value: "Be Vietnam Pro, sans-serif", category: "sans" },
  { name: "Red Hat Display", value: "Red Hat Display, sans-serif", category: "sans" },
  { name: "Space Grotesk", value: "Space Grotesk, sans-serif", category: "sans" },
  { name: "Syne", value: "Syne, sans-serif", category: "sans" },
  { name: "Archivo", value: "Archivo, sans-serif", category: "sans" },
  { name: "Ubuntu", value: "Ubuntu, sans-serif", category: "sans" },
  { name: "Kanit", value: "Kanit, sans-serif", category: "sans" },
  { name: "Josefin Sans", value: "Josefin Sans, sans-serif", category: "sans" },
  { name: "Fira Sans", value: "Fira Sans, sans-serif", category: "sans" },
  { name: "Barlow", value: "Barlow, sans-serif", category: "sans" },
  { name: "Titillium Web", value: "Titillium Web, sans-serif", category: "sans" },
  { name: "Asap", value: "Asap, sans-serif", category: "sans" },
  { name: "Karla", value: "Karla, sans-serif", category: "sans" },

  // 2. Elegant Serif (30 fonts)
  { name: "Playfair Display", value: "Playfair Display, serif", category: "serif" },
  { name: "Merriweather", value: "Merriweather, serif", category: "serif" },
  { name: "Lora", value: "Lora, serif", category: "serif" },
  { name: "Cinzel", value: "Cinzel, serif", category: "serif" },
  { name: "Cormorant Garamond", value: "Cormorant Garamond, serif", category: "serif" },
  { name: "EB Garamond", value: "EB Garamond, serif", category: "serif" },
  { name: "Libre Baskerville", value: "Libre Baskerville, serif", category: "serif" },
  { name: "Bitter", value: "Bitter, serif", category: "serif" },
  { name: "Bodoni Moda", value: "Bodoni Moda, serif", category: "serif" },
  { name: "Prata", value: "Prata, serif", category: "serif" },
  { name: "Marcellus", value: "Marcellus, serif", category: "serif" },
  { name: "Castoro", value: "Castoro, serif", category: "serif" },
  { name: "Spectral", value: "Spectral, serif", category: "serif" },
  { name: "DM Serif Display", value: "DM Serif Display, serif", category: "serif" },
  { name: "Fraunces", value: "Fraunces, serif", category: "serif" },
  { name: "Newsreader", value: "Newsreader, serif", category: "serif" },
  { name: "Playfair", value: "Playfair, serif", category: "serif" },
  { name: "Rozha One", value: "Rozha One, serif", category: "serif" },
  { name: "Abril Fatface", value: "Abril Fatface, serif", category: "serif" },
  { name: "Cardo", value: "Cardo, serif", category: "serif" },
  { name: "Frank Ruhl Libre", value: "Frank Ruhl Libre, serif", category: "serif" },
  { name: "Old Standard TT", value: "Old Standard TT, serif", category: "serif" },
  { name: "Fauna One", value: "Fauna One, serif", category: "serif" },
  { name: "Crimson Pro", value: "Crimson Pro, serif", category: "serif" },
  { name: "Gupter", value: "Gupter, serif", category: "serif" },
  { name: "Cinzel Decorative", value: "Cinzel Decorative, serif", category: "serif" },
  { name: "Vollkorn", value: "Vollkorn, serif", category: "serif" },
  { name: "Arapey", value: "Arapey, serif", category: "serif" },
  { name: "Cormorant", value: "Cormorant, serif", category: "serif" },
  { name: "Bona Nova", value: "Bona Nova, serif", category: "serif" },

  // 3. Bold Display & Vintage (30 fonts)
  { name: "Oswald", value: "Oswald, sans-serif", category: "display" },
  { name: "Bebas Neue", value: "Bebas Neue, sans-serif", category: "display" },
  { name: "Anton", value: "Anton, sans-serif", category: "display" },
  { name: "Bungee", value: "Bungee, sans-serif", category: "display" },
  { name: "Righteous", value: "Righteous, sans-serif", category: "display" },
  { name: "Titan One", value: "Titan One, sans-serif", category: "display" },
  { name: "Ultra", value: "Ultra, serif", category: "display" },
  { name: "Alfa Slab One", value: "Alfa Slab One, serif", category: "display" },
  { name: "Black Han Sans", value: "Black Han Sans, sans-serif", category: "display" },
  { name: "Chango", value: "Chango, sans-serif", category: "display" },
  { name: "Fugaz One", value: "Fugaz One, sans-serif", category: "display" },
  { name: "Shrikhand", value: "Shrikhand, serif", category: "display" },
  { name: "Bowlby One SC", value: "Bowlby One SC, sans-serif", category: "display" },
  { name: "Paytone One", value: "Paytone One, sans-serif", category: "display" },
  { name: "Russo One", value: "Russo One, sans-serif", category: "display" },
  { name: "Faster One", value: "Faster One, sans-serif", category: "display" },
  { name: "Monoton", value: "Monoton, sans-serif", category: "display" },
  { name: "Megrim", value: "Megrim, sans-serif", category: "display" },
  { name: "Poiret One", value: "Poiret One, sans-serif", category: "display" },
  { name: "Audiowide", value: "Audiowide, sans-serif", category: "display" },
  { name: "Orbitron", value: "Orbitron, sans-serif", category: "display" },
  { name: "Chakra Petch", value: "Chakra Petch, sans-serif", category: "display" },
  { name: "Fredoka", value: "Fredoka, sans-serif", category: "display" },
  { name: "Bungee Inline", value: "Bungee Inline, sans-serif", category: "display" },
  { name: "Sigmar", value: "Sigmar, sans-serif", category: "display" },
  { name: "Bangers", value: "Bangers, sans-serif", category: "display" },
  { name: "Staatliches", value: "Staatliches, sans-serif", category: "display" },
  { name: "Passion One", value: "Passion One, sans-serif", category: "display" },
  { name: "Squada One", value: "Squada One, sans-serif", category: "display" },
  { name: "Teko", value: "Teko, sans-serif", category: "display" },

  // 4. Handwriting & Script (30 fonts)
  { name: "Dancing Script", value: "Dancing Script, cursive", category: "handwriting" },
  { name: "Pacifico", value: "Pacifico, cursive", category: "handwriting" },
  { name: "Caveat", value: "Caveat, cursive", category: "handwriting" },
  { name: "Great Vibes", value: "Great Vibes, cursive", category: "handwriting" },
  { name: "Sacramento", value: "Sacramento, cursive", category: "handwriting" },
  { name: "Lobster", value: "Lobster, cursive", category: "handwriting" },
  { name: "Satisfy", value: "Satisfy, cursive", category: "handwriting" },
  { name: "Courgette", value: "Courgette, cursive", category: "handwriting" },
  { name: "Tangerine", value: "Tangerine, cursive", category: "handwriting" },
  { name: "Parisienne", value: "Parisienne, cursive", category: "handwriting" },
  { name: "Marck Script", value: "Marck Script, cursive", category: "handwriting" },
  { name: "Indie Flower", value: "Indie Flower, cursive", category: "handwriting" },
  { name: "Caveat Brush", value: "Caveat Brush, cursive", category: "handwriting" },
  { name: "Kalam", value: "Kalam, cursive", category: "handwriting" },
  { name: "Amatic SC", value: "Amatic SC, cursive", category: "handwriting" },
  { name: "Shadows Into Light", value: "Shadows Into Light, cursive", category: "handwriting" },
  { name: "Allura", value: "Allura, cursive", category: "handwriting" },
  { name: "Italianno", value: "Italianno, cursive", category: "handwriting" },
  { name: "Pinyon Script", value: "Pinyon Script, cursive", category: "handwriting" },
  { name: "Rochester", value: "Rochester, cursive", category: "handwriting" },
  { name: "Playball", value: "Playball, cursive", category: "handwriting" },
  { name: "Berkshire Swash", value: "Berkshire Swash, cursive", category: "handwriting" },
  { name: "Yellowtail", value: "Yellowtail, cursive", category: "handwriting" },
  { name: "Kaushan Script", value: "Kaushan Script, cursive", category: "handwriting" },
  { name: "Damion", value: "Damion, cursive", category: "handwriting" },
  { name: "Leckerli One", value: "Leckerli One, cursive", category: "handwriting" },
  { name: "Cookie", value: "Cookie, cursive", category: "handwriting" },
  { name: "Montez", value: "Montez, cursive", category: "handwriting" },
  { name: "Patrick Hand", value: "Patrick Hand, cursive", category: "handwriting" },
  { name: "Reenie Beanie", value: "Reenie Beanie, cursive", category: "handwriting" },

  // 5. Monospace & Code (10 fonts)
  { name: "Fira Code", value: "Fira Code, monospace", category: "mono" },
  { name: "JetBrains Mono", value: "JetBrains Mono, monospace", category: "mono" },
  { name: "Source Code Pro", value: "Source Code Pro, monospace", category: "mono" },
  { name: "Space Mono", value: "Space Mono, monospace", category: "mono" },
  { name: "Inconsolata", value: "Inconsolata, monospace", category: "mono" },
  { name: "IBM Plex Mono", value: "IBM Plex Mono, monospace", category: "mono" },
  { name: "Share Tech Mono", value: "Share Tech Mono, monospace", category: "mono" },
  { name: "VT323", value: "VT323, monospace", category: "mono" },
  { name: "Courier Prime", value: "Courier Prime, monospace", category: "mono" },
  { name: "Major Mono Display", value: "Major Mono Display, monospace", category: "mono" },
];

/**
 * Dynamically injects Google Font link tag when a font is selected
 */
export function loadGoogleFont(fontFamily: string) {
  if (typeof document === "undefined") return;
  const firstPart = fontFamily.split(",")[0];
  const cleanName = (firstPart || "").trim().replace(/['"]/g, "");
  if (!cleanName) return;
  // Don't fetch generic fallback system names
  if (["Arial", "system-ui", "sans-serif", "serif", "monospace", "cursive"].includes(cleanName)) {
    return;
  }
  const fontId = `gf-${cleanName.toLowerCase().replace(/\s+/g, "-")}`;
  if (document.getElementById(fontId)) return;

  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName)}:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&display=swap`;
  document.head.appendChild(link);
}
