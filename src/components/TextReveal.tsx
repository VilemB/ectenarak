"use client";

import React from "react";
import { motion } from "framer-motion";

interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  threshold?: number;
  type?: "words" | "characters" | "lines";
}

const TextReveal: React.FC<TextRevealProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  threshold = 0.2,
  type = "words",
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: duration,
        ease: [0.215, 0.61, 0.355, 1.0], // easeOutCubic
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: duration,
        delay: delay + i * 0.03,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    }),
  };

  const characterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: duration,
        delay: delay + i * 0.01,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    }),
  };

  const lineVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: duration,
        delay: delay,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    },
  };

  const renderContent = () => {
    if (typeof children !== "string") return children;

    if (type === "characters") {
      return children.split("").map((char, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={characterVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className={char === " " ? "invisible-space" : "reveal-char"}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ));
    }

    if (type === "words") {
      return children.split(" ").map((word, i) => (
        <React.Fragment key={i}>
          <motion.span
            custom={i}
            variants={wordVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="reveal-word"
          >
            {word}
          </motion.span>
          {i < children.split(" ").length - 1 && (
            <span className="invisible-space">&nbsp;</span>
          )}
        </React.Fragment>
      ));
    }

    return (
      <motion.span
        variants={lineVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="reveal-line"
      >
        {children}
      </motion.span>
    );
  };

  return (
    <motion.div
      className={`inline text-reveal ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      style={{ overflow: "hidden" }}
    >
      {renderContent()}
    </motion.div>
  );
};

export default TextReveal;
