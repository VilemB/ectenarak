"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScrollIndicatorProps {
  targetId: string;
  className?: string;
}

const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({
  targetId,
  className = "",
}) => {
  const handleClick = () => {
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`scroll-indicator ${className}`}
      initial={{ opacity: 0.6, y: 0 }}
      animate={{
        opacity: [0.6, 1, 0.6],
        y: [0, 10, 0],
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5V19M12 19L19 12M12 19L5 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
};

export default ScrollIndicator;
