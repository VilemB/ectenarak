import React from "react";

interface AiCreditsDisplayProps {
  aiCreditsRemaining: number;
  aiCreditsTotal: number;
  showLowCreditsWarning?: boolean;
  className?: string;
}

export default function AiCreditsDisplay({
  aiCreditsRemaining,
  aiCreditsTotal,
  showLowCreditsWarning = true,
  className = "",
}: AiCreditsDisplayProps) {
  // Calculate if credits are low (25% or less remaining)
  const isLowCredits = aiCreditsRemaining <= Math.ceil(aiCreditsTotal * 0.25);

  // Calculate percentage for progress bar
  const percentRemaining = (aiCreditsRemaining / aiCreditsTotal) * 100;

  return (
    <div className={`ai-credits-display ${className}`}>
      <div className="flex items-center">
        <div className="flex-1">
          <div className="h-2.5 bg-[#0f1729] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-out ${
                isLowCredits
                  ? "bg-gradient-to-r from-amber-600/70 to-amber-500"
                  : "bg-gradient-to-r from-amber-600/70 to-amber-400"
              }`}
              style={{
                width: `${percentRemaining}%`,
              }}
            ></div>
          </div>
        </div>
        <div className="ml-4 flex items-center">
          <span
            className={`font-medium text-sm ${
              isLowCredits ? "text-amber-400" : "text-amber-500"
            }`}
          >
            {aiCreditsRemaining}
          </span>
          <span className="text-gray-500 mx-1 text-sm">/</span>
          <span className="text-gray-400 text-sm">{aiCreditsTotal}</span>
        </div>
      </div>

      {showLowCreditsWarning && isLowCredits && (
        <p className="text-xs text-amber-400/80 mt-2 flex items-center">
          <span className="inline-block mr-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          Docházejí vám kredity pro AI
        </p>
      )}
    </div>
  );
}
