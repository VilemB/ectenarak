"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";

interface ThreeBackgroundProps {
  className?: string;
}

interface NavigatorWithDeviceInfo {
  deviceMemory?: number;
  hardwareConcurrency: number;
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
  const [isMobile, setIsMobile] = useState(false);
  const [isLowPowerDevice, setIsLowPowerDevice] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Wait for component to mount before accessing browser APIs
  useEffect(() => {
    // Only run this on the client side, never during SSR
    if (typeof window === "undefined") return;

    // Check for WebGL support and detect device capabilities
    try {
      // Check WebGL support
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setIsWebGLSupported(!!gl);

      // Detect mobile device
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isMobileDevice);

      // Check if device is low-powered
      const navigatorWithDeviceInfo = navigator as NavigatorWithDeviceInfo;
      const isLowEnd =
        isMobileDevice &&
        ((navigatorWithDeviceInfo.deviceMemory !== undefined &&
          navigatorWithDeviceInfo.deviceMemory < 4) ||
          navigatorWithDeviceInfo.hardwareConcurrency < 4 ||
          // Fallback: check screen resolution (less reliable)
          window.screen.width * window.devicePixelRatio < 1080);
      setIsLowPowerDevice(isLowEnd);

      // Set the component as mounted only after checking capabilities
      setIsMounted(true);
    } catch (e) {
      console.error("WebGL not supported", e);
      setIsWebGLSupported(false);
      setIsMounted(true);
    }

    return () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
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

    // Capture container reference for cleanup to avoid React hooks warning
    const currentContainer = containerRef.current;

    const initThreeJS = async () => {
      try {
        // Scene setup
        const scene = new THREE.Scene();
        // ... rest of existing code ...

        /* Event cleanup is handled by the outer useEffect
        return () => {
          window.removeEventListener("resize", handleResize);
          window.removeEventListener(
            "orientationchange",
            handleOrientationChange
          );
          window.removeEventListener("scroll", handleScroll);
        };
        */
      } catch (error) {
        console.error("Error initializing Three.js scene:", error);
        setIsWebGLSupported(false);
      }
    };

    // Initialize Three.js
    initThreeJS().catch((err) => {
      console.error("Error in ThreeJS initialization:", err);
    });

    // Cleanup
    return () => {
      mounted = false; // Set mounted flag to false to stop animation

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const renderer = rendererRef.current;
      const particles = particlesRef.current;
      const controls = controlsRef.current;

      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (containerRef.current && renderer) {
        try {
          containerRef.current.removeChild(renderer.domElement);
        } catch (e) {
          console.error("Error removing renderer:", e);
        }
      }

      if (particles) {
        particles.geometry.dispose();
        (particles.material as THREE.Material).dispose();
      }

      if (controls) {
        controls.dispose();
      }

      if (renderer) {
        renderer.dispose();
      }
    };
  }, [isMounted, isWebGLSupported, isMobile, isLowPowerDevice]);

  // Render nothing more than a container if WebGL isn't supported
  if (!isWebGLSupported && isMounted) {
    return (
      <>
        <div
          className={`fixed inset-0 w-full h-full bg-gradient-to-b from-background/60 to-background/90 ${className}`}
          style={{
            width: "100%",
            maxWidth: "100%",
            left: 0,
            right: 0,
            boxSizing: "border-box",
          }}
        />
        <div
          className="fixed inset-0 pointer-events-none z-[-1] bg-gradient-to-b from-background/30 via-background/10 to-background/40 backdrop-blur-[1px]"
          style={{
            width: "100%",
            maxWidth: "100%",
            left: 0,
            right: 0,
            boxSizing: "border-box",
          }}
        />
      </>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`fixed inset-0 pointer-events-none z-[-1] ${className}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      />
      {/* Add a gradient overlay div to improve text readability */}
      <div
        ref={gradientOverlayRef}
        className="fixed inset-0 pointer-events-none z-[-1] bg-gradient-to-b from-background/30 via-background/10 to-background/40 backdrop-blur-[1px]"
        style={{
          opacity: isMobile ? 0.3 : 0.25,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      />
    </>
  );
};

export default ThreeBackground;
