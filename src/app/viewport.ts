import type { Viewport } from "next";

// Server-side viewport config for proper mobile scaling
const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default viewport;
