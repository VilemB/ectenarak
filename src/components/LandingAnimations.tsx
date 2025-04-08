"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";

const LandingAnimations: React.FC = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply CSS animations
    if (backgroundRef.current) {
      backgroundRef.current.classList.add("gradient-animation");
    }

    if (titleRef.current) {
      titleRef.current.classList.add("zoom-in");
    }

    if (subtitleRef.current) {
      subtitleRef.current.classList.add("slide-in");
    }

    if (ctaRef.current) {
      ctaRef.current.classList.add("fade-in");
    }

    // Get all floating elements and add the animation class
    const floatingElements = document.querySelectorAll(".floating-element");
    floatingElements.forEach((element, index) => {
      element.classList.add("float");
      // Add staggered delay
      (element as HTMLElement).style.animationDelay = `${index * 0.2}s`;
    });

    // Add animation to yearly discount
    const yearlyDiscount = document.querySelector(".yearly-discount");
    if (yearlyDiscount) {
      yearlyDiscount.classList.add("bounce");
    }

    // Add animations to subscription cards
    const subscriptionCards = document.querySelectorAll(".subscription-card");
    subscriptionCards.forEach((card, index) => {
      card.classList.add("flip");
      // Add staggered delay for entry animations
      (card as HTMLElement).style.animationDelay = `${index * 0.2}s`;
    });

    // Cleanup function - no need to remove animations
    return () => {};
  }, []);

  return (
    <>
      <div ref={backgroundRef} className="absolute inset-0 z-[-1]"></div>

      <div ref={titleRef} className="opacity-0">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Vytvářejte své{" "}
          <span className="text-primary relative inline-block gradient-text">
            čtenářské zápisky
            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-primary/50 rounded-full"></span>
          </span>{" "}
          jednoduše
        </h1>
      </div>

      <div ref={subtitleRef} className="opacity-0">
        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
          Zapisujte si poznámky k povinné četbě, generujte shrnutí knih a
          autorů, a exportujte své zápisky do PDF.
        </p>
      </div>

      <div
        ref={ctaRef}
        className="opacity-0 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
      >
        <Button
          size="lg"
          className="transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95 hover-glow"
          onClick={() => {
            const element = document.getElementById("signup-section");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          Začít zdarma
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="transition-all duration-300 hover:shadow-md hover:bg-primary/10 active:scale-95 hover-glow"
          onClick={() => {
            const element = document.getElementById("features-section");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          Prozkoumat funkce
        </Button>
      </div>

      <div className="pt-4">
        <div
          className="flex justify-center lg:justify-start items-center text-sm text-muted-foreground cursor-pointer hover-scale"
          onClick={() => {
            const element = document.getElementById("features-section");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <span>Posuňte dolů pro více informací</span>
          <div className="ml-2">
            <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingAnimations;
