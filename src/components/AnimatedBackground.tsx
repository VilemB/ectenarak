"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimeInstance {
  pause: () => void;
}

const AnimatedBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimeInstance | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const setupAnimation = async () => {
      try {
        // Dynamic import of anime.js
        const animeModule = await import("animejs");
        const anime = animeModule.default || animeModule;

        // Create grid-based background elements
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = ""; // Clear any existing elements

        // Create a grid of subtle dots
        const dotCount = {
          x: Math.floor(window.innerWidth / 50),
          y: Math.floor(window.innerHeight / 50),
        };

        const dots: HTMLElement[] = [];

        // Create grid of dots
        for (let y = 0; y < dotCount.y; y++) {
          for (let x = 0; x < dotCount.x; x++) {
            const dot = document.createElement("div");
            dot.className = "bg-dot";

            // Adjust spacing to fill the screen nicely
            const xPos = (x / (dotCount.x - 1)) * 100;
            const yPos = (y / (dotCount.y - 1)) * 100;

            dot.style.left = `${xPos}%`;
            dot.style.top = `${yPos}%`;

            // Alternate dot colors slightly for visual interest
            const colorClass =
              (x + y) % 2 === 0 ? "bg-primary" : "bg-purple-500";
            dot.classList.add(colorClass);

            // Add varying opacity for depth
            const opacity = 0.03 + Math.random() * 0.07;
            dot.style.opacity = opacity.toString();

            container.appendChild(dot);
            dots.push(dot);
          }
        }

        // Add a few gradient blobs
        const blobCount = 3;
        const blobs: HTMLElement[] = [];

        for (let i = 0; i < blobCount; i++) {
          const blob = document.createElement("div");
          blob.className = "bg-blob";

          // Randomize position but keep somewhat centered
          const xPos = 20 + Math.random() * 60; // 20% to 80% of width
          const yPos = 20 + Math.random() * 60; // 20% to 80% of height

          blob.style.left = `${xPos}%`;
          blob.style.top = `${yPos}%`;

          // Set size
          const size = 200 + Math.random() * 200; // 200px to 400px
          blob.style.width = `${size}px`;
          blob.style.height = `${size}px`;

          // Use brand colors with very low opacity
          const colors = ["primary", "purple-500", "indigo-500"];
          const colorClass = `bg-${colors[i % colors.length]}`;
          blob.classList.add(colorClass);

          container.appendChild(blob);
          blobs.push(blob);
        }

        // Create subtle accent lines
        const lineCount = 5;
        const lines: HTMLElement[] = [];

        for (let i = 0; i < lineCount; i++) {
          const line = document.createElement("div");
          line.className = "bg-line";

          // Alternate horizontal and vertical lines
          const isHorizontal = i % 2 === 0;

          if (isHorizontal) {
            line.style.width = "100%";
            line.style.height = "1px";
            line.style.top = `${15 + (i * 70) / lineCount}%`;
            line.style.left = "0";
          } else {
            line.style.height = "100%";
            line.style.width = "1px";
            line.style.left = `${20 + (i * 60) / lineCount}%`;
            line.style.top = "0";
          }

          container.appendChild(line);
          lines.push(line);
        }

        // Utility function to generate random values (since we can't use anime.random directly)
        const random = (min: number, max: number) =>
          Math.random() * (max - min) + min;

        // Animate the background elements using anime.js
        const animateBackground = () => {
          // Subtle floating animation for dots
          anime({
            targets: dots,
            opacity: (el: HTMLElement) => {
              const currentOpacity = parseFloat(el.style.opacity);
              return [currentOpacity, currentOpacity + 0.05, currentOpacity];
            },
            translateY: () => random(-5, 5),
            translateX: () => random(-5, 5),
            easing: "easeInOutQuad",
            duration: 8000,
            delay: (_: Element, i: number) => i * 100, // Replace anime.stagger
            complete: animateBackground,
          });

          // Gentle pulsing animation for blobs
          anime({
            targets: blobs,
            scale: [1, 1.1, 1],
            opacity: (el: HTMLElement) => {
              return [el.style.opacity, "0.06", el.style.opacity];
            },
            easing: "easeInOutSine",
            duration: 25000,
            delay: (_: Element, i: number) => i * 8000, // Replace anime.stagger
          });

          // Subtle fade animation for lines
          anime({
            targets: lines,
            opacity: [0.03, 0.07, 0.03],
            easing: "easeInOutSine",
            duration: 15000,
            delay: (_: Element, i: number) => i * 3000, // Replace anime.stagger
          });
        };

        // Start the animation
        animateBackground();

        // Handle scroll effects
        const handleScroll = () => {
          const scrollY = window.scrollY;
          const viewportHeight = window.innerHeight;
          const documentHeight = document.body.scrollHeight;

          // Calculate scroll progress (0 to 1)
          const scrollProgress = Math.min(
            scrollY / (documentHeight - viewportHeight),
            1
          );

          // Subtle parallax effect
          blobs.forEach((blob, index) => {
            const translateY = scrollProgress * (index + 1) * -50; // Negative for parallax
            blob.style.transform = `translateY(${translateY}px)`;
          });

          // Fade edges based on scroll
          const fadeEdges = Math.min(scrollProgress * 2, 1);
          container.style.maskImage = `linear-gradient(rgba(0, 0, 0, ${
            1 - fadeEdges * 0.2
          }) 0%, 
                                                      rgba(0, 0, 0, 1) 30%,
                                                      rgba(0, 0, 0, 1) 70%,
                                                      rgba(0, 0, 0, ${
                                                        1 - fadeEdges * 0.2
                                                      }) 100%)`;
          container.style.webkitMaskImage = `linear-gradient(rgba(0, 0, 0, ${
            1 - fadeEdges * 0.2
          }) 0%, 
                                                           rgba(0, 0, 0, 1) 30%,
                                                           rgba(0, 0, 0, 1) 70%,
                                                           rgba(0, 0, 0, ${
                                                             1 - fadeEdges * 0.2
                                                           }) 100%)`;
        };

        window.addEventListener("scroll", handleScroll);

        // Initialize
        handleScroll();

        // Cleanup
        return () => {
          if (animationRef.current) {
            animationRef.current.pause();
          }
          window.removeEventListener("scroll", handleScroll);
        };
      } catch (error) {
        console.error("Failed to load anime.js:", error);
      }
    };

    setupAnimation();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    setMousePosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden"
    >
      <style jsx>{`
        .bg-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.05;
          transition: opacity 0.5s ease;
        }

        .bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.04;
          transform: translate(-50%, -50%);
          transform-origin: center;
          transition: transform 1s ease;
        }

        .bg-line {
          position: absolute;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(100, 100, 255, 0.05),
            transparent
          );
          opacity: 0.03;
        }

        .bg-primary {
          background-color: var(--primary, #3b82f6);
        }

        .bg-purple-500 {
          background-color: #8b5cf6;
        }

        .bg-indigo-500 {
          background-color: #6366f1;
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
