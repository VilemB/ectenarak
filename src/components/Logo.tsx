"use client";

import Image from "next/image";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "default" | "compact";
}

export default function Logo({
  showText = true,
  size = "md",
  className = "",
  variant = "default",
}: LogoProps) {
  // Set logo dimensions based on size
  const dimensions = {
    sm: { width: 28, height: 12 }, // Adjusted for the book logo's aspect ratio
    md: { width: 36, height: 15 }, // Adjusted for the book logo's aspect ratio
    lg: { width: 48, height: 20 }, // Adjusted for the book logo's aspect ratio
  };

  const { width, height } = dimensions[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0">
        <Image
          src="/logo-symbol.png"
          alt="Čtenářský deník"
          width={width}
          height={height}
          className="object-contain w-auto h-auto"
          quality={95}
          priority
        />
      </div>
      {showText && (
        <span
          className={`font-medium tracking-tight ${
            size === "lg" ? "text-xl" : "text-base"
          } hidden ${
            variant === "compact" ? "lg:inline-block" : "sm:inline-block"
          }`}
        >
          Čtenářský deník
        </span>
      )}
    </div>
  );
}
