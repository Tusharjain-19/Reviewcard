export function pageMeta(title: string, description: string) {
  const fullTitle =
    title === "ReviewCard"
      ? "ReviewCard — Smart Contactless Google Review Cards & Pages"
      : title.includes("ReviewCard")
        ? title
        : `${title} · ReviewCard`;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:site_name", content: "ReviewCard" },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "theme-color", content: "#1a73e8" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
  };
}
