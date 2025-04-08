"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScrollAnimationProps {
  children: React.ReactNode;
}

interface ElementWithProps extends React.ReactElement {
  props: {
    className?: string;
    children?: React.ReactNode;
  };
}

const ScrollAnimation: React.FC<ScrollAnimationProps> = ({ children }) => {
  // Animation variants for different elements
  const headingVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0], // easeOutCubic
      },
    },
  };

  const paragraphVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    },
  };

  const gridItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    },
  };

  // Helper function to wrap elements with motion components
  const wrapWithMotion = (
    element: React.ReactElement,
    variants: any,
    delay: number = 0
  ) => {
    if (
      element.type === "h1" ||
      element.type === "h2" ||
      element.type === "h3" ||
      element.type === "h4" ||
      element.type === "h5" ||
      element.type === "h6"
    ) {
      return (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={variants}
          transition={{ delay }}
        >
          {element}
        </motion.div>
      );
    }
    return element;
  };

  // Process children to add animations
  const processChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;

      const element = child as ElementWithProps;

      // Handle different element types
      if (
        element.type === "h1" ||
        element.type === "h2" ||
        element.type === "h3" ||
        element.type === "h4" ||
        element.type === "h5" ||
        element.type === "h6"
      ) {
        return wrapWithMotion(element, headingVariants, index * 0.1);
      }

      if (element.type === "p") {
        return wrapWithMotion(element, paragraphVariants, 0.2 + index * 0.1);
      }

      if (
        element.type === "button" ||
        element.props.className?.includes("button") ||
        element.type === "a"
      ) {
        return wrapWithMotion(element, buttonVariants, 0.3 + index * 0.1);
      }

      if (element.type === "img") {
        return wrapWithMotion(element, imageVariants, 0.2);
      }

      if (
        element.props.className?.includes("card") ||
        element.props.className?.includes("bg-card")
      ) {
        return wrapWithMotion(element, cardVariants, 0.1 + index * 0.1);
      }

      if (element.props.className?.includes("grid")) {
        return (
          <div className={element.props.className}>
            {React.Children.map(
              element.props.children,
              (gridItem, gridIndex) => {
                if (!React.isValidElement(gridItem)) return gridItem;
                return wrapWithMotion(
                  gridItem as ElementWithProps,
                  gridItemVariants,
                  0.1 + gridIndex * 0.1
                );
              }
            )}
          </div>
        );
      }

      // Recursively process nested children
      if (element.props.children) {
        return React.cloneElement(element, {
          children: processChildren(element.props.children),
        });
      }

      return element;
    });
  };

  return <>{processChildren(children)}</>;
};

export default ScrollAnimation;
