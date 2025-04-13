"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SubscriptionFeatureItem {
  name: string;
  description?: string;
  included: boolean;
}

export interface SubscriptionCardProps {
  title: string;
  subtitle: string;
  description: string;
  price: number | string;
  pricePeriod: string;
  priceId: string; // Stripe price ID
  features: SubscriptionFeatureItem[];
  icon: React.ReactNode;
  badge?: {
    text: string;
    color: string;
  };
  isCurrentPlan: boolean;
  isLoading: boolean;
  isSelected: boolean;
  accentColor: string;
  mutedColor: string;
  buttonText?: string;
  onSelect: () => void;
  isPremium?: boolean;
  animationDelay?: number;
  isLandingPage?: boolean;
}

export default function SubscriptionCard({
  title,
  subtitle,
  description,
  price,
  pricePeriod,
  priceId,
  features,
  icon,
  badge,
  isCurrentPlan,
  isLoading,
  isSelected,
  accentColor,
  mutedColor,
  buttonText = "Vybrat plán",
  onSelect,
  isPremium = false,
  animationDelay = 0.2,
  isLandingPage = false,
}: SubscriptionCardProps) {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsCheckoutLoading(true);

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/settings?success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        "Nepodařilo se vytvořit platební relaci. Zkuste to prosím znovu."
      );
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: animationDelay }}
      whileHover={{ y: -5 }}
      className={`glass-card glass-card-hover ${
        isPremium
          ? `border-2 border-[${accentColor}]`
          : "border border-[#2a3548]"
      } overflow-hidden relative flex flex-col h-full ${
        isPremium ? "md:scale-[1.03] md:-translate-y-1 z-10" : ""
      }`}
    >
      {/* Premium background glow effect */}
      {isPremium && (
        <div
          className={`absolute -inset-1 bg-${accentColor}/20 blur-xl opacity-30 rounded-xl`}
        ></div>
      )}

      {/* Badge in top right corner */}
      {badge && (
        <div className="absolute top-4 right-4 z-10">
          <div
            className={`${
              badge.color ? badge.color : "bg-[#2a3548]"
            } text-xs font-medium px-3 py-1 rounded-full shadow-sm`}
          >
            {badge.text}
          </div>
        </div>
      )}

      <div className={`relative z-1 p-5 sm:p-6 flex flex-col h-full`}>
        {/* Header with icon and title */}
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 mr-3 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline mb-4">
          <span className="text-3xl sm:text-4xl md:text-5xl font-bold">
            {typeof price === "number" ? `${price} Kč` : price}
          </span>
          {pricePeriod && (
            <span className="text-muted-foreground ml-2 text-sm">
              {pricePeriod}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-5 sm:mb-6">
          {description}
        </p>

        {/* Action Button */}
        <Button
          className={`w-full mb-6 sm:mb-8 py-5 ${
            isCurrentPlan
              ? `bg-${accentColor}/10 text-${accentColor}`
              : isPremium
                ? `bg-gradient-to-r from-${accentColor} to-indigo-600 hover:from-${accentColor}/90 hover:to-indigo-500 text-white`
                : `bg-[${accentColor}] hover:bg-[${accentColor}]/90 text-white`
          } rounded-full shadow-lg hover:shadow-xl transition-all duration-300`}
          variant={isCurrentPlan ? "outline" : "default"}
          onClick={isCurrentPlan || isLandingPage ? onSelect : handleCheckout}
          disabled={
            isCurrentPlan || isLoading || isSelected || isCheckoutLoading
          }
        >
          {isSelected || isCheckoutLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : isCurrentPlan ? (
            <span className="flex items-center justify-center font-medium">
              Aktivní plán <Check className="ml-2 h-4 w-4" />
            </span>
          ) : (
            <span className="flex items-center justify-center font-medium">
              {buttonText}
            </span>
          )}
        </Button>

        {/* Features section */}
        <div
          className={`text-xs uppercase tracking-wider mb-4 font-medium text-[${mutedColor}] border-t border-[#2a3548] pt-4`}
        >
          ZAHRNUJE
        </div>
        <ul className="space-y-2.5 sm:space-y-3 mt-auto">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check
                className={`h-4 w-4 text-${
                  feature.included ? accentColor : "muted-foreground"
                } mr-3 mt-0.5 shrink-0`}
              />
              <span className="text-sm">
                {feature.name}
                {feature.description && (
                  <span className="text-muted-foreground">
                    {" "}
                    {feature.description}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
