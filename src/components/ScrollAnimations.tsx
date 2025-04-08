"use client";

import React, { useEffect, useRef } from "react";

const ScrollAnimations: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorFollowerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  // Properly typed ref callback function
  const setSectionRef = (index: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[index] = el;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Animation loop function
    const animate = (time: number) => {
      // Animation logic goes here

      // Request next frame
      requestRef.current = requestAnimationFrame(animate);
    };

    // Handle scroll animations
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;

      // Update progress bar
      if (progressBarRef.current) {
        const progress = Math.min(scrollY / (documentHeight - windowHeight), 1);
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }

      // Animate sections based on scroll position
      sectionRefs.current.forEach((section, index) => {
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const inView = rect.top < windowHeight && rect.bottom > 0;

        if (inView) {
          // Calculate how far element is through the viewport
          const progress = Math.min(
            Math.max(
              (windowHeight - rect.top) / (windowHeight + rect.height),
              0
            ),
            1
          );

          // Parallax effect for backgrounds
          const backgrounds =
            section.querySelectorAll<HTMLElement>(".parallax-bg");
          backgrounds.forEach((bg) => {
            bg.style.transform = `translateY(${progress * 30}%)`;
          });

          // Fade and slide in content
          const contentElements =
            section.querySelectorAll<HTMLElement>(".animate-content");
          contentElements.forEach((element, i) => {
            const delay = i * 0.1;
            const elementProgress = Math.max(progress * 2 - delay, 0);
            const clampedProgress = Math.min(elementProgress, 1);

            element.style.opacity = clampedProgress.toString();
            element.style.transform = `translateY(${
              (1 - clampedProgress) * 30
            }px)`;
          });

          // Scale effect for images
          const images = section.querySelectorAll<HTMLElement>(".scale-image");
          images.forEach((img) => {
            const scale = 1 + progress * 0.1;
            img.style.transform = `scale(${scale})`;
          });

          // Text reveal effect
          const textReveal =
            section.querySelectorAll<HTMLElement>(".text-reveal");
          textReveal.forEach((text, i) => {
            const delay = i * 0.15;
            const textProgress = Math.max(progress * 1.5 - delay, 0);
            const clampedTextProgress = Math.min(textProgress, 1);

            text.style.clipPath = `inset(0 ${
              100 - clampedTextProgress * 100
            }% 0 0)`;
          });

          // Rotate elements
          const rotateElements =
            section.querySelectorAll<HTMLElement>(".rotate-element");
          rotateElements.forEach((element) => {
            const rotation = progress * 360;
            element.style.transform = `rotate(${rotation}deg)`;
          });
        }
      });
    };

    // Custom cursor effect
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current && cursorFollowerRef.current) {
        // Main cursor
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;

        // Follower cursor (with delay)
        setTimeout(() => {
          if (cursorFollowerRef.current) {
            cursorFollowerRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
          }
        }, 100);

        // Check if over interactive element
        const target = e.target as HTMLElement;
        const isHoverable = target.closest("a, button, input, .hoverable");

        if (isHoverable) {
          cursorRef.current.classList.add("cursor-expanded");
          cursorFollowerRef.current.classList.add("follower-expanded");
        } else {
          cursorRef.current.classList.remove("cursor-expanded");
          cursorFollowerRef.current.classList.remove("follower-expanded");
        }
      }
    };

    // Special scroll effect for horizontal sections
    const handleHorizontalScroll = () => {
      const horizontalSections =
        document.querySelectorAll<HTMLElement>(".horizontal-scroll");
      horizontalSections.forEach((section) => {
        const scrollContainer =
          section.querySelector<HTMLElement>(".scroll-container");
        if (!scrollContainer) return;

        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const scrollProgress = Math.max(
            0,
            Math.min(
              1,
              (window.innerHeight - rect.top) /
                (window.innerHeight + rect.height - window.innerHeight)
            )
          );
          const translateX =
            scrollProgress *
            (scrollContainer.scrollWidth - section.clientWidth);
          scrollContainer.style.transform = `translateX(-${translateX}px)`;
        }
      });
    };

    // Create and position elements for page transition effect
    const createTransitionElements = () => {
      const container = document.createElement("div");
      container.className = "page-transition-container";

      for (let i = 0; i < 5; i++) {
        const bar = document.createElement("div");
        bar.className = "transition-bar";
        bar.style.left = `${i * 20}%`;
        container.appendChild(bar);
      }

      document.body.appendChild(container);
      return container;
    };

    // Page transition effect
    const pageTransition = createTransitionElements();
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = (link as HTMLAnchorElement).getAttribute("href");
        if (href && href.startsWith("/")) {
          e.preventDefault();

          // Trigger transition animation
          pageTransition.classList.add("transition-active");

          // Navigate after animation completes
          setTimeout(() => {
            window.location.href = href;
          }, 800);
        }
      });
    });

    // Set up event listeners
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleHorizontalScroll);
    window.addEventListener("mousemove", handleMouseMove);

    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);

    // Initial call to set positions
    handleScroll();
    handleHorizontalScroll();

    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleHorizontalScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      if (pageTransition.parentNode) {
        pageTransition.parentNode.removeChild(pageTransition);
      }
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="scroll-animations-container">
        {/* Progress bar at top of screen */}
        <div className="progress-bar-container">
          <div ref={progressBarRef} className="progress-bar"></div>
        </div>

        {/* Custom cursor elements */}
        <div ref={cursorRef} className="custom-cursor"></div>
        <div ref={cursorFollowerRef} className="cursor-follower"></div>

        {/* Section 1: Hero with text reveal */}
        <div ref={setSectionRef(0)} className="scroll-section hero-section">
          <div className="parallax-bg hero-bg"></div>
          <div className="content-container">
            <h1 className="text-reveal">Creative</h1>
            <h1 className="text-reveal">Design Studio</h1>
            <p className="animate-content">
              Scroll to explore our world of design
            </p>
            <button className="animate-content hoverable">Discover More</button>
          </div>
        </div>

        {/* Section 2: Featured work with horizontal scroll */}
        <div
          ref={setSectionRef(1)}
          className="scroll-section horizontal-scroll"
        >
          <h2 className="section-title animate-content">Featured Work</h2>
          <div className="scroll-container">
            <div className="work-item hoverable">
              <div className="scale-image work-image"></div>
              <h3 className="animate-content">Project One</h3>
            </div>
            <div className="work-item hoverable">
              <div className="scale-image work-image"></div>
              <h3 className="animate-content">Project Two</h3>
            </div>
            <div className="work-item hoverable">
              <div className="scale-image work-image"></div>
              <h3 className="animate-content">Project Three</h3>
            </div>
          </div>
        </div>

        {/* Section 3: About with rotating elements */}
        <div ref={setSectionRef(2)} className="scroll-section about-section">
          <div className="two-column-layout">
            <div className="left-column">
              <h2 className="animate-content">About Us</h2>
              <p className="animate-content">
                We create digital experiences that blend creativity with
                technology.
              </p>
              <p className="animate-content">
                Our team of designers and developers work together to build
                memorable brands.
              </p>
            </div>
            <div className="right-column">
              <div className="rotate-element circular-shape"></div>
              <div
                className="rotate-element square-shape"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Section 4: Services with staggered animations */}
        <div ref={setSectionRef(3)} className="scroll-section services-section">
          <h2 className="section-title animate-content">Our Services</h2>
          <div className="services-grid">
            <div className="service-card animate-content hoverable">
              <div className="service-icon"></div>
              <h3>Web Design</h3>
              <p>
                Creating beautiful, functional websites that engage your
                audience.
              </p>
            </div>
            <div
              className="service-card animate-content hoverable"
              style={{ transitionDelay: "0.1s" }}
            >
              <div className="service-icon"></div>
              <h3>Branding</h3>
              <p>
                Developing distinctive brand identities that stand out in the
                market.
              </p>
            </div>
            <div
              className="service-card animate-content hoverable"
              style={{ transitionDelay: "0.2s" }}
            >
              <div className="service-icon"></div>
              <h3>Development</h3>
              <p>
                Building robust digital platforms with cutting-edge technology.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Contact with text animations */}
        <div ref={setSectionRef(4)} className="scroll-section contact-section">
          <div className="parallax-bg contact-bg"></div>
          <div className="content-container">
            <h2 className="text-reveal">Let's work</h2>
            <h2 className="text-reveal">together</h2>
            <a
              href="mailto:contact@example.com"
              className="animate-content contact-link hoverable"
            >
              contact@example.com
            </a>
          </div>
        </div>
      </div>

      {/* Add required CSS for the animations */}
      <style jsx>{`
        .scroll-animations-container {
          position: relative;
          width: 100%;
        }

        .progress-bar-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1000;
        }

        .progress-bar {
          height: 100%;
          background: #3b82f6;
          transform-origin: left;
          transform: scaleX(0);
        }

        .custom-cursor {
          position: fixed;
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s;
        }

        .cursor-follower {
          position: fixed;
          width: 40px;
          height: 40px;
          border: 1px solid rgba(59, 130, 246, 0.5);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          transform: translate(-50%, -50%);
          transition: transform 0.1s ease-out, width 0.3s, height 0.3s,
            opacity 0.3s;
        }

        .cursor-expanded {
          width: 24px;
          height: 24px;
          background: rgba(59, 130, 246, 0.5);
        }

        .follower-expanded {
          width: 60px;
          height: 60px;
          opacity: 0.3;
        }

        .scroll-section {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 60px 20px;
        }

        .parallax-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 120%;
          z-index: -1;
          background-size: cover;
          background-position: center;
          will-change: transform;
        }

        .hero-bg {
          background: linear-gradient(135deg, #1a202c, #2d3748);
        }

        .contact-bg {
          background: linear-gradient(135deg, #2d3748, #1a202c);
        }

        .content-container {
          max-width: 1200px;
          width: 100%;
          z-index: 1;
        }

        .text-reveal {
          position: relative;
          font-size: 4rem;
          font-weight: bold;
          line-height: 1.2;
          color: white;
          margin: 0;
          display: inline-block;
          clip-path: inset(0 100% 0 0);
          will-change: clip-path;
        }

        .animate-content {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
          will-change: opacity, transform;
        }

        .horizontal-scroll {
          padding: 100px 0;
          overflow: hidden;
        }

        .scroll-container {
          display: flex;
          will-change: transform;
        }

        .work-item {
          min-width: 400px;
          margin-right: 40px;
        }

        .scale-image {
          width: 100%;
          height: 250px;
          background-color: #3b82f6;
          will-change: transform;
          overflow: hidden;
        }

        .work-image {
          background-color: #8338ec;
        }

        .two-column-layout {
          display: flex;
          max-width: 1200px;
          width: 100%;
        }

        .left-column,
        .right-column {
          flex: 1;
          padding: 20px;
        }

        .rotate-element {
          position: relative;
          width: 200px;
          height: 200px;
          will-change: transform;
        }

        .circular-shape {
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8338ec);
        }

        .square-shape {
          background: linear-gradient(135deg, #8338ec, #ff006e);
          top: -100px;
          left: 100px;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px;
          max-width: 1200px;
          width: 100%;
        }

        .service-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 30px;
          transition: transform 0.3s ease;
        }

        .service-card:hover {
          transform: translateY(-10px);
        }

        .service-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8338ec);
          margin-bottom: 20px;
        }

        .contact-link {
          display: inline-block;
          font-size: 1.5rem;
          color: #3b82f6;
          text-decoration: none;
          border-bottom: 1px solid #3b82f6;
          padding-bottom: 5px;
          margin-top: 30px;
        }

        .page-transition-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          pointer-events: none;
        }

        .transition-bar {
          position: absolute;
          top: 0;
          width: 20%;
          height: 0;
          background: #3b82f6;
          transition: height 0.8s cubic-bezier(0.76, 0, 0.24, 1);
        }

        .transition-active .transition-bar {
          height: 100%;
        }

        .transition-active .transition-bar:nth-child(2) {
          transition-delay: 0.1s;
        }

        .transition-active .transition-bar:nth-child(3) {
          transition-delay: 0.2s;
        }

        .transition-active .transition-bar:nth-child(4) {
          transition-delay: 0.3s;
        }

        .transition-active .transition-bar:nth-child(5) {
          transition-delay: 0.4s;
        }

        /* Make sure elements don't appear when off-screen */
        @media (prefers-reduced-motion: no-preference) {
          .scroll-section {
            visibility: visible;
          }
        }
      `}</style>
    </>
  );
};

export default ScrollAnimations;
