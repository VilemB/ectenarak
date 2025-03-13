"use client";

import React from "react";
import LoginForm from "@/components/LoginForm";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  return (
    <>
      {/* Include Navbar explicitly for the login page */}
      <Navbar user={null} />

      <div className="min-h-[calc(100vh-4rem)] pt-20 pb-32">
        {/* Background that covers entire page */}
        <div className="fixed inset-0 bg-gradient-to-b from-background via-background/95 to-background overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
            <div
              className="absolute bottom-40 right-20 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-accent/10 rounded-full blur-[120px] opacity-20 animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-20 animate-pulse"
              style={{ animationDelay: "4s" }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
}
