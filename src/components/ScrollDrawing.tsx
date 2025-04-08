"use client";

import React, { useEffect, useRef } from "react";

const ScrollDrawing: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Get all path elements from the SVG
    pathsRef.current = Array.from(svgRef.current.querySelectorAll("path"));

    // Set up each path for drawing animation
    pathsRef.current.forEach((path) => {
      // Get the length of the path
      const length = path.getTotalLength();

      // Set up the starting position of the drawing
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.transition = "none";

      // Force a reflow to ensure the styling is applied before animations start
      path.getBoundingClientRect();
    });

    // Handle scroll to draw the SVG paths
    const handleScroll = () => {
      const scrollPercentage =
        (document.documentElement.scrollTop + document.body.scrollTop) /
        (document.documentElement.scrollHeight -
          document.documentElement.clientHeight);

      pathsRef.current.forEach((path, index) => {
        const length = path.getTotalLength();

        // Calculate draw progress with staggered start based on index
        const startPoint = index * 0.1; // Each path starts at a different scroll point
        const endPoint = startPoint + 0.4; // Each path completes drawing over this scroll percentage

        // Calculate the drawing progress
        let drawProgress;
        if (scrollPercentage < startPoint) {
          drawProgress = 0;
        } else if (scrollPercentage > endPoint) {
          drawProgress = 1;
        } else {
          drawProgress =
            (scrollPercentage - startPoint) / (endPoint - startPoint);
        }

        // Apply the drawing effect
        const drawLength = length * (1 - drawProgress);
        path.style.transition = "stroke-dashoffset 0.1s ease-in-out";
        path.style.strokeDashoffset = `${drawLength}`;
      });
    };

    // Initial draw
    handleScroll();

    // Add scroll listener
    window.addEventListener("scroll", handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="scroll-drawing-container">
      <svg
        ref={svgRef}
        className="scroll-drawing-svg"
        viewBox="0 0 800 600"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Abstract decorative paths that draw as you scroll */}
        <path
          d="M100,100 C150,50 200,150 250,100 S350,50 400,100 S500,150 550,100 S650,50 700,100"
          fill="none"
          stroke="#3498db"
          strokeWidth="2"
        />
        <path
          d="M100,200 C200,150 300,250 400,200 S600,150 700,200"
          fill="none"
          stroke="#9b59b6"
          strokeWidth="2"
        />
        <path
          d="M150,300 C250,250 350,350 450,300 S650,250 700,300"
          fill="none"
          stroke="#e74c3c"
          strokeWidth="2"
        />

        {/* Decorative circle */}
        <circle
          cx="400"
          cy="400"
          r="50"
          fill="none"
          stroke="#f1c40f"
          strokeWidth="2"
          strokeDasharray="314"
          strokeDashoffset="314"
          className="animate-circle"
        />

        {/* Abstract lines */}
        <path
          d="M100,500 L700,500"
          fill="none"
          stroke="#1abc9c"
          strokeWidth="2"
        />
        <path
          d="M200,450 L600,450"
          fill="none"
          stroke="#3498db"
          strokeWidth="2"
        />
        <path
          d="M300,550 L500,550"
          fill="none"
          stroke="#9b59b6"
          strokeWidth="2"
        />

        {/* Connect paths with dots */}
        <circle cx="100" cy="100" r="4" fill="#3498db" />
        <circle cx="700" cy="100" r="4" fill="#3498db" />
        <circle cx="100" cy="200" r="4" fill="#9b59b6" />
        <circle cx="700" cy="200" r="4" fill="#9b59b6" />
        <circle cx="150" cy="300" r="4" fill="#e74c3c" />
        <circle cx="700" cy="300" r="4" fill="#e74c3c" />
        <circle cx="100" cy="500" r="4" fill="#1abc9c" />
        <circle cx="700" cy="500" r="4" fill="#1abc9c" />
        <circle cx="200" cy="450" r="4" fill="#3498db" />
        <circle cx="600" cy="450" r="4" fill="#3498db" />
        <circle cx="300" cy="550" r="4" fill="#9b59b6" />
        <circle cx="500" cy="550" r="4" fill="#9b59b6" />
      </svg>

      <style jsx>{`
        .scroll-drawing-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .scroll-drawing-svg {
          width: 100%;
          height: 100%;
          opacity: 0.7;
        }

        .animate-circle {
          animation: circleDraw 2s ease-in-out forwards;
          animation-delay: 1s;
        }

        @keyframes circleDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Hide on mobile */
        @media (max-width: 768px) {
          .scroll-drawing-container {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ScrollDrawing;
