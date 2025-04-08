"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

interface ScrollProgressProps {
  color?: string;
  height?: number;
}

const ScrollProgress: React.FC<ScrollProgressProps> = ({
  color = "var(--primary)",
  height = 2,
}) => {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handleScroll = () => {
      const windowScroll = window.scrollY;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (windowScroll / documentHeight) * 100;
      setScrollPercentage(scrollPercent);
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Initial calculation
    handleScroll();

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    spring.set(scrollPercentage);
  }, [scrollPercentage, spring]);

  return (
    <div
      className="progress-bar-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: `${height}px`,
        background: "rgba(255, 255, 255, 0.1)",
        zIndex: 1000,
      }}
    >
      <motion.div
        className="progress-bar"
        style={{
          height: "100%",
          background: color,
          transformOrigin: "left",
        }}
        animate={{
          scaleX: scrollPercentage / 100,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 30,
        }}
      />
    </div>
  );
};

export default ScrollProgress;
