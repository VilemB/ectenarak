import React from "react";

type LoadingAnimationProps = {
  className?: string;
};

export default function LoadingAnimation({
  className = "",
}: LoadingAnimationProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-md z-10 pointer-events-none ${className}`}
    >
      <div className="animate-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </div>
  );
}
