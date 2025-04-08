"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";

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
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
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
    camera.position.z = 15;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControlsImpl(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = false;
    controlsRef.current = controls;

    // Create particle system
    const particleCount = 2500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Color palette
    const colorPalette = [
      new THREE.Color(0x3b82f6).multiplyScalar(0.8), // Medium blue
      new THREE.Color(0x8b5cf6).multiplyScalar(0.8), // Medium purple
      new THREE.Color(0x6366f1).multiplyScalar(0.8), // Medium indigo
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const noise = Math.sin(theta * 3) * Math.cos(phi * 2) * 0.5;
      const finalRadius = radius * (1 + noise);

      const x = finalRadius * Math.sin(phi) * Math.cos(theta);
      const y = finalRadius * Math.sin(phi) * Math.sin(theta) * 0.7;
      const z = finalRadius * Math.cos(phi) * 0.3 - 2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const colorIndex = Math.floor(Math.random() * colorPalette.length);
      const nextColorIndex = (colorIndex + 1) % colorPalette.length;
      const mixRatio = Math.random();

      const color = colorPalette[colorIndex]
        .clone()
        .lerp(colorPalette[nextColorIndex], mixRatio);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.12 + 0.06;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (500.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord;
          float dist = length(uv - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.25, dist);
          gl_FragColor = vec4(vColor, alpha * 0.45);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
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

    // Handle scroll with more pronounced effect
    const handleScroll = () => {
      requestAnimationFrame(() => {
        const scrollHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = Math.min(window.scrollY / scrollHeight, 1);
        scrollProgressRef.current = scrollProgress;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    // Animation loop with enhanced effects
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

      // Enhanced rotation based on scroll
      const targetRotationY = scrollProgress * Math.PI * 2; // Full rotation
      const targetRotationX = scrollProgress * Math.PI * 0.5; // Quarter rotation

      // Faster rotation response
      particlesRef.current.rotation.y +=
        (targetRotationY - particlesRef.current.rotation.y) * 0.1;
      particlesRef.current.rotation.x +=
        (targetRotationX - particlesRef.current.rotation.x) * 0.1;

      // Enhanced zoom effect
      const targetZ = 15 - scrollProgress * 8; // More pronounced zoom
      cameraRef.current.position.z +=
        (targetZ - cameraRef.current.position.z) * 0.1;

      // Gentle floating motion
      const time = Date.now() * 0.001;
      particlesRef.current.position.y = Math.sin(time * 0.2) * 0.15;

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
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: "none" }}
    />
  );
};

export default ThreeBackground;
