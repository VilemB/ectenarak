import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [
  { width: 16, height: 16, name: "favicon-16x16.png" },
  { width: 32, height: 32, name: "favicon-32x32.png" },
  { width: 48, height: 48, name: "favicon.png" },
  { width: 180, height: 180, name: "apple-touch-icon.png" },
  { width: 192, height: 192, name: "android-chrome-192x192.png" },
  { width: 512, height: 512, name: "android-chrome-512x512.png" },
  { width: 70, height: 70, name: "mstile-70x70.png" },
  { width: 150, height: 150, name: "mstile-150x150.png" },
  { width: 310, height: 310, name: "mstile-310x310.png" },
  { width: 310, height: 150, name: "mstile-310x150.png" },
  { width: 512, height: 512, name: "maskable-icon.png" },
];

async function generateFavicons() {
  const inputFile = path.join(
    path.dirname(__dirname),
    "public",
    "logo-symbol.png"
  );

  // Create favicon directory if it doesn't exist
  const faviconDir = path.join(path.dirname(__dirname), "public");
  try {
    await fs.access(faviconDir);
  } catch {
    await fs.mkdir(faviconDir, { recursive: true });
  }

  // Generate PNG favicons
  for (const size of sizes) {
    await sharp(inputFile)
      .resize(size.width, size.height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(path.join(faviconDir, size.name));
    console.log(`Generated ${size.name}`);
  }

  // Generate Safari SVG icon
  await sharp(inputFile)
    .resize(512, 512)
    .toFormat("png") // Convert to PNG first
    .toBuffer()
    .then((data) => {
      return sharp(data).toFile(path.join(faviconDir, "safari-pinned-tab.png"));
    });
  console.log("Generated safari-pinned-tab.png");

  // Copy 32x32 PNG as favicon.ico (browsers will use PNG anyway)
  await fs.copyFile(
    path.join(faviconDir, "favicon-32x32.png"),
    path.join(faviconDir, "favicon.ico")
  );
  console.log("Copied favicon.ico");

  console.log("All favicons generated successfully!");
}

generateFavicons().catch(console.error);
