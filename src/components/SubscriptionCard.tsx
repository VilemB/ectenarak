"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubscriptionFeatureItem {
  name: string;
  description?: string;
  included: boolean;
}

export interface SubscriptionCardProps {
  title: string;
  description: string;
  price: number | string;
  pricePeriod: string;
  features: SubscriptionFeatureItem[];
  icon: React.ReactNode;
  badge?: {
    text: string;
    color: string;
  };
  isCurrentPlan: boolean;
  isLoading: boolean;
  isSelected: boolean;
  buttonText?: string | null;
  onSelect: () => void;
  disabled?: boolean;
  animationDelay?: number;
  isYearly?: boolean;
  monthlyPrice?: number | string;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  title,
  description,
  price,
  pricePeriod,
  features,
  icon,
  badge,
  isCurrentPlan,
  isLoading,
  isSelected,
  buttonText,
  onSelect,
  disabled = false,
  animationDelay = 0,
  isYearly = false,
  monthlyPrice,
}) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut", delay: animationDelay },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "relative flex flex-col h-full rounded-2xl border border-border/20 bg-card/80 p-6 shadow-lg backdrop-blur-sm",
        isCurrentPlan ? "border-blue-500 ring-2 ring-blue-500/50" : "",
        isSelected ? "border-white" : ""
      )}
    >
      {badge && (
        <div
          className={`absolute top-0 right-6 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}
        >
          {badge.text}
        </div>
      )}

      <div className="mb-5 flex items-center space-x-3">
        <div className="rounded-lg bg-muted/40 p-2">{icon}</div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      </div>

      <p className="mb-5 min-h-[40px] text-muted-foreground text-sm">
        {description}
      </p>

      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-foreground">
          {price}
        </span>
        <span className="text-sm font-semibold text-muted-foreground">
          {pricePeriod}
        </span>
      </div>

      {isYearly && monthlyPrice && (
        <p className="mb-6 text-xs text-muted-foreground">
          Platba ročně, odpovídá {monthlyPrice} Kč / měsíc.
        </p>
      )}

      <ul className="space-y-3 text-sm flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check
              className={cn(
                "mr-2 mt-0.5 h-4 w-4 flex-shrink-0",
                feature.included ? "text-blue-500" : "text-muted-foreground/50"
              )}
            />
            <span
              className={cn(
                feature.included
                  ? "text-foreground"
                  : "text-muted-foreground/70"
              )}
            >
              {feature.name}
              {feature.description && (
                <span className="ml-1 text-xs text-muted-foreground/80">
                  ({feature.description})
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-6 border-t border-border/20">
        {buttonText && (
          <Button
            onClick={onSelect}
            disabled={disabled || isLoading || isCurrentPlan}
            className={cn(
              "w-full transition-all duration-300 shadow-md text-base font-semibold py-3 rounded-full",
              isCurrentPlan &&
                "bg-muted/50 text-muted-foreground cursor-not-allowed",
              !isCurrentPlan &&
                (disabled
                  ? "bg-gray-600 hover:bg-gray-500 cursor-not-allowed opacity-60"
                  : "bg-blue-600 hover:bg-blue-700 text-white"),
              isLoading && "opacity-70 cursor-wait",
              isSelected &&
                "ring-2 ring-offset-2 ring-offset-background ring-white"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                <span>Zpracovává se...</span>
              </div>
            ) : (
              buttonText
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default SubscriptionCard;
