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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
