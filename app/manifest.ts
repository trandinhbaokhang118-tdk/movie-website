import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CineWave",
    short_name: "CineWave",
    description: "Rạp phim cá nhân, đồng bộ trên mọi màn hình.",
    start_url: "/browse",
    display: "standalone",
    background_color: "#05040b",
    theme_color: "#8b7cff",
    icons: [{ src: "/cinewave-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
