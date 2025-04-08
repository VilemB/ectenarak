"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface ThreeBackgroundProps {
  className?: string;
}

const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationRef = useRef<number | null>(null);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 8;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Create organic particle system
    const particleCount = 1500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Color palette
    const colorPalette = [
      new THREE.Color(0x3b82f6), // Primary blue
      new THREE.Color(0x8b5cf6), // Purple
      new THREE.Color(0x6366f1), // Indigo
    ];

    for (let i = 0; i < particleCount; i++) {
      // Create organic distribution using noise-like function
      const radius = Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Add some noise to create organic distribution
      const noise = Math.sin(theta * 3) * Math.cos(phi * 2) * 0.3;
      const finalRadius = radius * (1 + noise);

      positions[i * 3] = finalRadius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = finalRadius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = finalRadius * Math.cos(phi);

      // Color with smooth transitions
      const colorIndex = Math.floor(Math.random() * colorPalette.length);
      const nextColorIndex = (colorIndex + 1) % colorPalette.length;
      const mixRatio = Math.random();

      const color = colorPalette[colorIndex]
        .clone()
        .lerp(colorPalette[nextColorIndex], mixRatio);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Vary particle sizes
      sizes[i] = Math.random() * 0.03 + 0.01;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Add subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Handle scroll
    const handleScroll = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current = window.scrollY / scrollHeight;
    };

    window.addEventListener("scroll", handleScroll);

    // Animation loop
    const animate = () => {
      if (
        !sceneRef.current ||
        !cameraRef.current ||
        !rendererRef.current ||
        !controlsRef.current ||
        !particlesRef.current
      )
        return;

      const scrollProgress = scrollProgressRef.current;

      // Smooth rotation based on scroll
      particlesRef.current.rotation.y = scrollProgress * Math.PI;
      particlesRef.current.rotation.x = scrollProgress * Math.PI * 0.5;

      // Subtle zoom effect
      cameraRef.current.position.z = 8 - scrollProgress * 2;

      // Add subtle floating motion
      const time = Date.now() * 0.001;
      particlesRef.current.position.y = Math.sin(time * 0.2) * 0.1;

      // Update controls
      controlsRef.current.update();

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        (particlesRef.current.material as THREE.Material).dispose();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-[-1] ${className}`}
    />
  );
};

export default ThreeBackground;
