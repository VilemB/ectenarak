"use client";

import React, { useEffect, useRef, useState } from "react";

const MubasicScrollAnimations: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const balls = useRef<Ball[]>([]);

  // Ball object for animations
  interface Ball {
    x: number;
    y: number;
    radius: number;
    color: string;
    speedX: number;
    speedY: number;
    opacity: number;
    targetX: number;
    targetY: number;
  }

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    // Initialize canvas and dimensions
    updateDimensions();

    // Generate balls
    const generateBalls = () => {
      const colors = ["#3498db", "#9b59b6", "#e74c3c", "#f1c40f", "#1abc9c"];
      const newBalls: Ball[] = [];

      for (let i = 0; i < 30; i++) {
        const radius = Math.random() * 20 + 5;
        const x = Math.random() * dimensions.width;
        const y = Math.random() * dimensions.height;

        newBalls.push({
          x,
          y,
          radius,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: (Math.random() - 0.5) * 0.8,
          opacity: 0.5 + Math.random() * 0.3,
          targetX: x,
          targetY: y,
        });
      }

      balls.current = newBalls;
    };

    // Main animation loop
    const animate = () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update ball positions based on scroll and mouse
      const scrollInfluence = scrollPosition / 1000; // Adjust divisor for effect intensity

      balls.current.forEach((ball, index) => {
        // Update target position based on mouse
        const mouseInfluence = 0.01;
        const distX = mousePosition.x - ball.x;
        const distY = mousePosition.y - ball.y;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist < 200) {
          // Move away from cursor
          const angle = Math.atan2(distY, distX);
          const repelStrength = ((200 - dist) / 200) * 5;
          ball.targetX -= Math.cos(angle) * repelStrength;
          ball.targetY -= Math.sin(angle) * repelStrength;
        }

        // Move towards target with easing
        ball.x += (ball.targetX - ball.x) * 0.05;
        ball.y += (ball.targetY - ball.y) * 0.05;

        // Add subtle movement
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        // Add scroll influence - different effects for different balls
        if (index % 3 === 0) {
          // Some balls move horizontally with scroll
          ball.x += Math.sin(scrollInfluence) * 0.5;
        } else if (index % 3 === 1) {
          // Some balls move vertically with scroll
          ball.y += Math.cos(scrollInfluence) * 0.5;
        } else {
          // Some balls change size with scroll
          const sizeModifier = 1 + Math.sin(scrollInfluence) * 0.2;
          const currentRadius = ball.radius * sizeModifier;

          // Draw with size modification
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = ball.color;
          ctx.globalAlpha = ball.opacity;
          ctx.fill();

          // Continue to next ball since we've already drawn this one
          return;
        }

        // Bounce off edges
        if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
          ball.speedX *= -1;
          ball.targetX = ball.x; // Reset target to avoid getting stuck
        }

        if (ball.y < ball.radius || ball.y > canvas.height - ball.radius) {
          ball.speedY *= -1;
          ball.targetY = ball.y; // Reset target to avoid getting stuck
        }

        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.globalAlpha = ball.opacity;
        ctx.fill();
      });

      // Reset alpha
      ctx.globalAlpha = 1;

      // Draw connecting lines between nearby balls
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 0.5;

      for (let i = 0; i < balls.current.length; i++) {
        for (let j = i + 1; j < balls.current.length; j++) {
          const ball1 = balls.current[i];
          const ball2 = balls.current[j];

          const dx = ball1.x - ball2.x;
          const dy = ball1.y - ball2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            // Opacity based on distance
            ctx.globalAlpha = ((150 - distance) / 150) * 0.2;

            ctx.beginPath();
            ctx.moveTo(ball1.x, ball1.y);
            ctx.lineTo(ball2.x, ball2.y);
            ctx.stroke();
          }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    // Handle scroll events
    const handleScroll = () => {
      setScrollPosition(window.scrollY);

      // Update ball targets based on scroll
      balls.current.forEach((ball, index) => {
        // Create different movement patterns based on index
        const scrollSpeed = window.scrollY - scrollPosition;
        const direction = index % 2 === 0 ? 1 : -1;

        ball.targetX += direction * scrollSpeed * 0.05;
        ball.targetY += scrollSpeed * 0.03;
      });
    };

    // Handle mouse move events
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Handle resize events
    const handleResize = () => {
      updateDimensions();

      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }

      // Reposition balls after resize
      balls.current.forEach((ball) => {
        ball.x = Math.random() * window.innerWidth;
        ball.y = Math.random() * window.innerHeight;
        ball.targetX = ball.x;
        ball.targetY = ball.y;
      });
    };

    // Set up canvas
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      generateBalls();
      requestRef.current = requestAnimationFrame(animate);
    }

    // Add event listeners
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [dimensions, scrollPosition, mousePosition]);

  // React to content being scrolled
  useEffect(() => {
    const handleContentAnimation = () => {
      const elements = document.querySelectorAll(".animate-on-scroll");

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isInView =
          rect.top <= window.innerHeight * 0.8 && rect.bottom >= 0;

        if (isInView) {
          element.classList.add("is-visible");
        }
      });
    };

    // Initial check
    handleContentAnimation();

    // Add scroll event
    window.addEventListener("scroll", handleContentAnimation);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleContentAnimation);
    };
  }, []);

  return (
    <div ref={containerRef} className="mubasic-animations">
      <canvas ref={canvasRef} className="animation-canvas" />

      {/* Overlay content with scroll animations */}
      <div className="content-overlay">
        <div className="scroll-section first-section">
          <div className="text-container animate-on-scroll">
            <h1 className="heading">
              <span className="heading-part">Design</span>
              <span className="heading-part">×</span>
              <span className="heading-part">Technology</span>
            </h1>
            <p className="subheading animate-on-scroll">
              Scroll to discover our digital universe
            </p>
          </div>
        </div>

        <div className="scroll-section second-section">
          <div className="grid-container">
            <div className="grid-item animate-on-scroll">
              <div className="item-number">01</div>
              <h3>Creative Design</h3>
              <p>Innovative solutions that captivate and inspire</p>
            </div>
            <div className="grid-item animate-on-scroll">
              <div className="item-number">02</div>
              <h3>Web Development</h3>
              <p>Crafting seamless digital experiences</p>
            </div>
            <div className="grid-item animate-on-scroll">
              <div className="item-number">03</div>
              <h3>Digital Strategy</h3>
              <p>Data-driven approaches for maximum impact</p>
            </div>
          </div>
        </div>

        <div className="scroll-section third-section">
          <div className="marquee animate-on-scroll">
            <div className="marquee-content">
              <span>Innovation</span>
              <span className="separator">•</span>
              <span>Design</span>
              <span className="separator">•</span>
              <span>Technology</span>
              <span className="separator">•</span>
              <span>Creativity</span>
              <span className="separator">•</span>
            </div>
            <div className="marquee-content">
              <span>Innovation</span>
              <span className="separator">•</span>
              <span>Design</span>
              <span className="separator">•</span>
              <span>Technology</span>
              <span className="separator">•</span>
              <span>Creativity</span>
              <span className="separator">•</span>
            </div>
          </div>

          <div className="cta-container animate-on-scroll">
            <button className="cta-button">Let's Connect</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mubasic-animations {
          position: relative;
          width: 100%;
          min-height: 300vh;
          overflow: hidden;
        }

        .animation-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .content-overlay {
          position: relative;
          z-index: 10;
        }

        .scroll-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .first-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .text-container {
          max-width: 800px;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }

        .heading {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          line-height: 1.2;
        }

        .heading-part {
          display: inline-block;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
          transition-delay: var(--delay, 0s);
        }

        .heading-part:nth-child(1) {
          --delay: 0.2s;
        }

        .heading-part:nth-child(2) {
          --delay: 0.4s;
        }

        .heading-part:nth-child(3) {
          --delay: 0.6s;
        }

        .subheading {
          font-size: 1.2rem;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
          transition-delay: 0.8s;
        }

        .second-section {
          padding: 8rem 2rem;
        }

        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          width: 100%;
        }

        .grid-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 8px;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
          transition-delay: var(--delay, 0s);
        }

        .grid-item:nth-child(1) {
          --delay: 0.1s;
        }

        .grid-item:nth-child(2) {
          --delay: 0.3s;
        }

        .grid-item:nth-child(3) {
          --delay: 0.5s;
        }

        .item-number {
          font-size: 3rem;
          font-weight: 700;
          background: linear-gradient(90deg, #3498db, #9b59b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
        }

        .third-section {
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 8rem 0;
        }

        .marquee {
          display: flex;
          overflow: hidden;
          width: 100%;
          margin-bottom: 4rem;
        }

        .marquee-content {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: marquee 20s linear infinite;
          padding-right: 4rem;
        }

        .marquee-content span {
          font-size: 3rem;
          font-weight: 700;
          padding: 0 1rem;
        }

        .separator {
          color: rgba(255, 255, 255, 0.3);
        }

        .cta-container {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
          transition-delay: 0.3s;
        }

        .cta-button {
          padding: 1rem 2.5rem;
          font-size: 1.2rem;
          font-weight: 500;
          background: linear-gradient(90deg, #3498db, #9b59b6);
          border: none;
          border-radius: 50px;
          color: white;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .cta-button:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        /* Scroll animation classes */
        .animate-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-on-scroll.is-visible .heading-part,
        .animate-on-scroll.is-visible .subheading {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        @media (max-width: 768px) {
          .heading {
            font-size: 2.5rem;
          }

          .marquee-content span {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MubasicScrollAnimations;
