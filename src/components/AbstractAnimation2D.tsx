"use client";

import React, { useEffect, useRef, useState } from "react";

interface Shape {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  update: (width: number, height: number) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

const AbstractAnimation2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const requestRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Helper function to create an elegant color
  const getGradientColor = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.6)"); // Primary blue
    gradient.addColorStop(0.5, "rgba(147, 51, 234, 0.3)"); // Purple
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)"); // Transparent blue
    return gradient;
  };

  // Draw flowing lines
  const drawFlowingLines = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => {
    ctx.save();

    // Create thin, elegant flowing lines
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();

      // Line starting and ending points
      const startX = width * 0.2;
      const endX = width * 0.8;

      // Vertical position based on index with oscillation
      const baseY = height * (0.3 + i * 0.1);

      // Create flowing effect with oscillation
      ctx.moveTo(startX, baseY);

      // Control points for elegant curve
      const cp1x = width * 0.4;
      const cp1y = baseY + Math.sin(time * 0.5 + i) * 15;

      const cp2x = width * 0.6;
      const cp2y = baseY - Math.sin(time * 0.5 + i + 1) * 15;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, baseY);

      // Line style
      ctx.strokeStyle =
        i % 2 === 0
          ? "rgba(59, 130, 246, " + (0.1 + Math.sin(time + i) * 0.05) + ")" // Primary blue
          : "rgba(147, 51, 234, " + (0.1 + Math.sin(time + i) * 0.05) + ")"; // Purple
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Draw floating particles
  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => {
    ctx.save();

    // Create subtle floating particles
    for (let i = 0; i < 30; i++) {
      // Position with gentle movement
      const x =
        width * 0.5 +
        Math.cos(time * 0.2 + i * 0.5) * width * 0.3 +
        Math.sin(time * 0.1 + i) * 20;
      const y =
        height * 0.5 +
        Math.sin(time * 0.2 + i * 0.5) * height * 0.2 +
        Math.cos(time * 0.1 + i) * 20;

      // Size oscillation
      const size = 3 + Math.sin(time + i) * 1;

      // Draw particle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);

      // Alternate colors between blue and purple with transparency
      const opacity = 0.1 + Math.sin(time * 0.5 + i) * 0.05;
      ctx.fillStyle =
        i % 3 === 0
          ? `rgba(59, 130, 246, ${opacity})` // Blue
          : i % 3 === 1
          ? `rgba(147, 51, 234, ${opacity})` // Purple
          : `rgba(255, 255, 255, ${opacity})`; // White

      ctx.fill();
    }

    ctx.restore();
  };

  // Draw highlight effect following mouse
  const drawMouseHighlight = (
    ctx: CanvasRenderingContext2D,
    mouseX: number,
    mouseY: number
  ) => {
    if (mouseX === 0 && mouseY === 0) return; // Skip if mouse hasn't moved yet

    ctx.save();

    // Create subtle glow around mouse
    const gradient = ctx.createRadialGradient(
      mouseX,
      mouseY,
      0,
      mouseX,
      mouseY,
      100
    );
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Main draw function
  const draw = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw flowing lines
    drawFlowingLines(ctx, width, height, time);

    // Draw floating particles
    drawParticles(ctx, width, height, time);

    // Draw mouse highlight
    drawMouseHighlight(ctx, mouseRef.current.x, mouseRef.current.y);
  };

  // Animation loop
  const animate = (timestamp: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Update time
    timeRef.current = timestamp * 0.001; // Convert to seconds

    // Draw frame
    draw(ctx, canvas.width, canvas.height, timeRef.current);

    // Request next frame
    requestRef.current = requestAnimationFrame(animate);
  };

  // Handle mouse movement
  const handleMouseMove = (event: MouseEvent) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Get mouse position relative to canvas
    mouseRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  // Handle resize
  const handleResize = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const { width, height } = canvas.getBoundingClientRect();

    // Set canvas size to match display size
    canvas.width = width;
    canvas.height = height;
  };

  const getRandomColor = () => {
    const colors = [
      "rgba(59, 130, 246, 0.5)", // blue
      "rgba(139, 92, 246, 0.5)", // purple
      "rgba(236, 72, 153, 0.5)", // pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize shapes
    const initialShapes: Shape[] = Array.from({ length: 10 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 50 + 20,
      color: getRandomColor(),
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      update: function (width: number, height: number) {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > width) this.speedX *= -1;
        if (this.y < 0 || this.y > height) this.speedY *= -1;
      },
      draw: function (ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      },
    }));

    setShapes(initialShapes);

    let animationFrameId: number;
    let lastTime = 0;
    const fps = 60;
    const frameInterval = 1000 / fps;

    const animate = (currentTime: number) => {
      if (!ctx || !canvasRef.current) return;

      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameInterval) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      lastTime = currentTime - (deltaTime % frameInterval);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw shapes
      shapes.forEach((shape) => {
        shape.update(canvas.width, canvas.height);
        shape.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [shapes]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: -1 }}
    />
  );
};

export default AbstractAnimation2D;
