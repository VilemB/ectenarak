import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Čtenářský deník",
  description: "Sledujte své čtenářské zážitky a pokrok",
  icons: {
    icon: [
      {
        url: "/logo-symbol.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/logo-symbol.png",
        type: "image/png",
        sizes: "16x16",
      },
    ],
    apple: {
      url: "/logo-symbol.png",
      type: "image/png",
      sizes: "180x180",
    },
    shortcut: { url: "/favicon.ico" },
  },
};
