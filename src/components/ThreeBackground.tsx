"use client";

import React, { useEffect, useRef, useState } from "react";
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
  const [isMounted, setIsMounted] = useState(false);
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const gradientOverlayRef = useRef<HTMLDivElement>(null);

  // Wait for component to mount before accessing browser APIs
  useEffect(() => {
    setIsMounted(true);

    // Check for WebGL support
    if (typeof window !== "undefined") {
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        setIsWebGLSupported(!!gl);
      } catch (e) {
        console.error("WebGL not supported", e);
        setIsWebGLSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    // Only run this effect on client-side after the component is mounted
    if (
      !isMounted ||
      typeof window === "undefined" ||
      !isWebGLSupported ||
      !containerRef.current
    )
      return;

    // Prevent memory leaks
    let mounted = true;

    const initThreeJS = async () => {
      try {
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
        camera.position.z = 15; // Zoom in closer from 20 to 15
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance", // Change from low-power to high-performance for better visuals
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if (containerRef.current) {
          containerRef.current.appendChild(renderer.domElement);
        }
        rendererRef.current = renderer;

        // Controls setup
        const controls = new OrbitControlsImpl(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.enablePan = false;
        controlsRef.current = controls;

        // Create organic particle system
        const particleCount = 3500; // Increase from 2500 to 3500 for more particles
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Color palette - make colors more vibrant but somewhat more transparent
        const colorPalette = [
          new THREE.Color(0x3b82f6).multiplyScalar(0.85), // Slightly less bright for better readability
          new THREE.Color(0x8b5cf6).multiplyScalar(0.85),
          new THREE.Color(0x6366f1).multiplyScalar(0.85),
          new THREE.Color(0x4f46e5).multiplyScalar(0.85),
        ];

        for (let i = 0; i < particleCount; i++) {
          // Create distribution that pushes particles more to the sides/edges for better readability
          // Use a gaussian-like distribution for denser core
          let radius;
          const gaussianFactor = Math.random();

          // Modify particle distribution - push more particles to the edges
          if (gaussianFactor < 0.4) {
            // 40% of particles in edge areas
            radius = 7 + Math.random() * 6; // More particles near the edges
          } else if (gaussianFactor < 0.65) {
            // 25% in middle area
            radius = 4 + Math.random() * 3; // Mid-distance particles
          } else {
            // 35% in center but more spread
            radius = Math.random() * 4 * (0.5 + Math.random()); // More varied center distribution
          }

          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          // Add some noise to create organic distribution - increased noise factor for more interesting shapes
          const noise = Math.sin(theta * 4) * Math.cos(phi * 3) * 0.4;
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

          // Vary particle sizes - slightly smaller for better readability
          sizes[i] = Math.random() * 0.16 + 0.06;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        // Custom shader for circular particles - improved brightness and bloom effect
        const vertexShader = `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (600.0 / -mvPosition.z); // 500 to 600 for larger points
            gl_Position = projectionMatrix * mvPosition;
          }
        `;

        // Adjusted fragment shader for better text readability (lower opacity)
        const fragmentShader = `
          varying vec3 vColor;
          void main() {
            vec2 uv = gl_PointCoord;
            float dist = length(uv - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = smoothstep(0.5, 0.2, dist);
            gl_FragColor = vec4(vColor, alpha * 0.45); // Reduced from 0.6 to 0.45 for readability
          }
        `;

        const material = new THREE.ShaderMaterial({
          uniforms: {},
          vertexShader,
          fragmentShader,
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

        // Handle scroll
        const handleScroll = () => {
          const scrollHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const newScrollProgress = window.scrollY / scrollHeight;
          scrollProgressRef.current = newScrollProgress;

          // Update gradient overlay opacity based on scroll
          if (gradientOverlayRef.current) {
            // Make it darker as user scrolls down to improve text readability
            const baseOpacity = 0.25; // Start with some opacity
            const maxAdditionalOpacity = 0.2; // Add up to this much as they scroll
            const newOpacity =
              baseOpacity + newScrollProgress * maxAdditionalOpacity;
            gradientOverlayRef.current.style.opacity = newOpacity.toString();
          }
        };

        window.addEventListener("scroll", handleScroll);
        // Initialize scroll handler once
        handleScroll();

        // Animation loop
        const animate = () => {
          if (
            !mounted ||
            !sceneRef.current ||
            !cameraRef.current ||
            !rendererRef.current ||
            !controlsRef.current ||
            !particlesRef.current
          )
            return;

          const scrollProgress = scrollProgressRef.current;

          // More subtle rotation based on scroll
          particlesRef.current.rotation.y = scrollProgress * Math.PI * 0.5;
          particlesRef.current.rotation.x = scrollProgress * Math.PI * 0.25;

          // More subtle zoom effect
          cameraRef.current.position.z = 15 - scrollProgress * 6; // Adjust from 20-4 to 15-6 for stronger zoom

          // Add subtle floating motion with more dynamic movement
          const time = Date.now() * 0.001;
          particlesRef.current.position.y = Math.sin(time * 0.1) * 0.3; // 0.2 to 0.3
          particlesRef.current.position.x = Math.sin(time * 0.05) * 0.2; // Add horizontal motion

          // Add subtle rotation to the entire scene for more dynamic feel
          particlesRef.current.rotation.z = Math.sin(time * 0.03) * 0.03;

          // Update controls - only if browser is not throttling for better performance
          const now = performance.now();
          const isVisible = document.visibilityState === "visible";

          // Full quality when focused, reduced when tab is in background
          if (isVisible) {
            controlsRef.current.update();
            // Render scene at full quality
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          } else {
            // Skip control updates and render at lower rate when not visible
            if (now % 3 === 0) {
              rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
          }

          animationRef.current = requestAnimationFrame(animate);
        };

        animate();
      } catch (error) {
        console.error("Error initializing Three.js scene:", error);
        setIsWebGLSupported(false);
      }
    };

    initThreeJS();

    // Cleanup
    return () => {
      mounted = false;
      window.removeEventListener("resize", () => {});
      window.removeEventListener("scroll", () => {});
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current && rendererRef.current) {
        try {
          containerRef.current.removeChild(rendererRef.current.domElement);
        } catch (e) {
          console.error("Error removing renderer:", e);
        }
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
  }, [isMounted, isWebGLSupported]); // Add isWebGLSupported as a dependency

  // Render nothing more than a container if WebGL isn't supported
  if (!isWebGLSupported && isMounted) {
    return (
      <div
        className={`fixed inset-0 w-full h-full bg-gradient-to-b from-background/60 to-background/90 ${className}`}
      />
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`fixed inset-0 w-full h-full pointer-events-none z-[-1] ${className}`}
      />
      {/* Add a gradient overlay div to improve text readability */}
      <div
        ref={gradientOverlayRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-[-1] bg-gradient-to-b from-background/30 via-background/10 to-background/40 backdrop-blur-[1px]"
        style={{ opacity: 0.25 }}
      />
    </>
  );
};

export default ThreeBackground;
