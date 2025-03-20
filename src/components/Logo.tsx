"use client";

import Image from "next/image";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({
  showText = true,
  size = "md",
  className = "",
}: LogoProps) {
  // Set logo dimensions based on size
  const dimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
  };

  const { width, height } = dimensions[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-shrink-0">
        <Image
          src="/logo-symbol.png"
          alt="Čtenářský deník"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span
          className={`font-medium ${
            size === "lg" ? "text-xl" : "text-base"
          } hidden sm:inline-block`}
        >
          Čtenářský deník
        </span>
      )}
    </div>
  );
}
