"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  User,
  AlertCircle,
  CheckCircle,
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Nesprávné přihlašovací údaje. Zkuste to znovu.");
        setIsSigningIn(false);
        return;
      }

      if (result?.ok) {
        // Check if there's a stored subscription intent
        const intendedSubscription = sessionStorage.getItem(
          "intendedSubscription"
        );

        if (intendedSubscription) {
          // Clear the stored data
          sessionStorage.removeItem("intendedSubscription");
          sessionStorage.removeItem("yearlyBilling");

          // Redirect to subscription page
          router.push("/subscription");
        } else {
          // Default redirect
          router.push("/");
        }

        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Došlo k chybě při přihlašování. Zkuste to znovu později.");
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    setError("");
    setSuccess("");

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Vyplňte prosím všechna pole.");
      setIsSigningUp(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků.");
      setIsSigningUp(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Došlo k chybě při registraci.");
      }

      // Check if there's a subscription intent
      const intendedSubscription = sessionStorage.getItem(
        "intendedSubscription"
      );

      if (intendedSubscription) {
        setSuccess(
          "Účet byl úspěšně vytvořen! Přihlaste se pro dokončení vašeho předplatného."
        );
      } else {
        setSuccess("Účet byl úspěšně vytvořen! Nyní se můžete přihlásit.");
      }

      setFormData({ name: "", email: "", password: "" });

      // Switch to login tab after successful registration
      setTimeout(() => {
        setActiveTab("login");
        setSuccess("");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Došlo k chybě při registraci.";
      setError(errorMessage);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      // Store intended redirect for Google auth callback
      const intendedSubscription = sessionStorage.getItem(
        "intendedSubscription"
      );
      const callbackUrl = intendedSubscription ? "/subscription" : "/";

      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Došlo k chybě při přihlašování přes Google.");
      setIsGoogleSigningIn(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError("");
    setSuccess("");
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.05,
        when: "beforeChildren",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        staggerChildren: 0.03,
        staggerDirection: -1,
        when: "afterChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const errorVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: {
      opacity: 1,
      y: 0,
      height: "auto",
      transition: { duration: 0.3 },
    },
    exit: { opacity: 0, y: -10, height: 0, transition: { duration: 0.2 } },
  };

  const successVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: {
      opacity: 1,
      y: 0,
      height: "auto",
      transition: { duration: 0.3 },
    },
    exit: { opacity: 0, y: -10, height: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          eČtenářák
        </h2>
        <p className="text-sm text-blue-300/70">
          Přihlaste se nebo si vytvořte účet
        </p>
      </div>

      <Tabs
        defaultValue="login"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full relative z-10"
      >
        <TabsList className="w-full grid grid-cols-2 mb-8 bg-transparent relative z-20">
          <TabsTrigger
            value="login"
            className="bg-transparent text-sm data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:border-b data-[state=active]:border-blue-400 rounded-none transition-colors"
          >
            Přihlášení
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="bg-transparent text-sm data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:border-b data-[state=active]:border-blue-400 rounded-none transition-colors"
          >
            Registrace
          </TabsTrigger>
        </TabsList>

        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "login" && (
              <motion.div
                key="login-form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div variants={itemVariants}>
                    <div className="relative z-10">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/50 z-20" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 h-11 bg-blue-950/30 border-blue-400/10 rounded-lg focus:border-blue-400/30 focus:ring-0 placeholder:text-blue-300/30"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="relative z-10">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/50 z-20" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Heslo"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-28 h-11 bg-blue-950/30 border-blue-400/10 rounded-lg focus:border-blue-400/30 focus:ring-0 placeholder:text-blue-300/30"
                      />
                      <Button
                        variant="link"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0 h-auto text-xs text-blue-400 hover:text-blue-300 hover:underline z-20"
                        type="button"
                      >
                        Zapomenuté heslo?
                      </Button>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        key="error-message"
                        variants={errorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="text-red-400 text-sm flex items-start gap-2"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full h-11 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors"
                      disabled={isSigningIn}
                    >
                      {isSigningIn ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      Přihlásit se
                    </Button>
                  </motion.div>

                  <div className="relative flex items-center justify-center my-6 z-10">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-blue-400/10"></div>
                    </div>
                    <div className="relative px-4 text-xs text-blue-300 bg-background z-20">
                      nebo pokračujte s
                    </div>
                  </div>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 bg-blue-950/30 border-blue-400/10 text-blue-300 hover:bg-blue-900/30 hover:border-blue-400/20 rounded-lg transition-colors"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleSigningIn}
                    >
                      {isGoogleSigningIn ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <svg
                          className="h-4 w-4 mr-2"
                          aria-hidden="true"
                          focusable="false"
                          data-prefix="fab"
                          data-icon="google"
                          role="img"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 488 512"
                        >
                          <path
                            fill="currentColor"
                            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                          ></path>
                        </svg>
                      )}
                      Pokračovat s Google
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            )}

            {activeTab === "signup" && (
              <motion.div
                key="signup-form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <form onSubmit={handleSignUp} className="space-y-5">
                  <motion.div variants={itemVariants}>
                    <div className="relative z-10">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/50 z-20" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Jméno"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 h-11 bg-blue-950/30 border-blue-400/10 rounded-lg focus:border-blue-400/30 focus:ring-0 placeholder:text-blue-300/30"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="relative z-10">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/50 z-20" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 h-11 bg-blue-950/30 border-blue-400/10 rounded-lg focus:border-blue-400/30 focus:ring-0 placeholder:text-blue-300/30"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="relative z-10">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/50 z-20" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Heslo"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 h-11 bg-blue-950/30 border-blue-400/10 rounded-lg focus:border-blue-400/30 focus:ring-0 placeholder:text-blue-300/30"
                      />
                    </div>
                    <p className="text-xs text-blue-300 mt-2">
                      Heslo musí mít alespoň 6 znaků
                    </p>
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        key="error-message"
                        variants={errorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="text-red-400 text-sm flex items-start gap-2"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {success && (
                      <motion.div
                        key="success-message"
                        variants={successVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="text-emerald-400 text-sm flex items-start gap-2"
                      >
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full h-11 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors"
                      disabled={isSigningUp}
                    >
                      {isSigningUp ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <User className="h-4 w-4 mr-2" />
                      )}
                      Vytvořit účet
                    </Button>
                    <p className="text-xs text-blue-300 mt-3 text-center">
                      Registrací souhlasíte s{" "}
                      <Link
                        href="/terms"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        podmínkami použití
                      </Link>
                    </p>
                  </motion.div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}
