"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
        router.push("/");
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

      setSuccess("Účet byl úspěšně vytvořen! Nyní se můžete přihlásit.");
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
      await signIn("google", { callbackUrl: "/" });
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
    <div className="w-full max-w-md mx-auto relative py-16 md:py-24">
      {/* Enhanced decorative elements with larger sizes and adjusted positioning */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl from-indigo-500/20 to-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] max-w-2xl max-h-2xl bg-gradient-to-b from-transparent to-blue-950/30 rounded-3xl blur-3xl -z-20 opacity-50" />

      <div className="mb-10 text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          eČtenářák
        </h2>
        <p className="text-muted-foreground text-sm">
          Přihlaste se nebo si vytvořte účet
        </p>
      </div>

      <Tabs
        defaultValue="login"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-10 rounded-full p-1 bg-muted/30 backdrop-blur-sm border border-white/5">
          <TabsTrigger
            value="login"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
          >
            Přihlášení
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
          >
            Registrace
          </TabsTrigger>
        </TabsList>

        <div className="relative min-h-[420px]">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "login" && (
              <motion.div
                key="login-form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0"
              >
                <motion.div
                  variants={itemVariants}
                  className="space-y-2 text-center mb-8"
                >
                  <h3 className="text-2xl font-semibold">Vítejte zpět</h3>
                  <p className="text-sm text-muted-foreground">
                    Přihlaste se ke svému účtu
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="vas@email.cz"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="pl-10 h-12 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-transparent border border-white/10 text-foreground"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Heslo
                      </Label>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs text-blue-400 hover:text-blue-300"
                        type="button"
                      >
                        Zapomenuté heslo?
                      </Button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="pl-10 h-12 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-transparent border border-white/10 text-foreground"
                      />
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
                        className="bg-red-500/10 text-red-400 text-sm p-4 rounded-xl flex items-start gap-2 border border-red-500/20"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
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
                </form>

                <motion.div variants={itemVariants} className="mt-8">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative bg-background px-4 text-xs text-muted-foreground">
                      nebo pokračujte s
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl transition-all duration-300 hover:shadow-md hover:bg-white/5 border-white/10 backdrop-blur-sm"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleSigningIn}
                  >
                    {isGoogleSigningIn ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <svg
                        className="h-5 w-5 mr-2"
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
              </motion.div>
            )}

            {activeTab === "signup" && (
              <motion.div
                key="signup-form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0"
              >
                <motion.div
                  variants={itemVariants}
                  className="space-y-2 text-center mb-8"
                >
                  <h3 className="text-2xl font-semibold">Vytvořit účet</h3>
                  <p className="text-sm text-muted-foreground">
                    Zaregistrujte se a začněte používat aplikaci
                  </p>
                </motion.div>

                <form onSubmit={handleSignUp} className="space-y-6">
                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Jméno
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Vaše jméno"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="pl-10 h-12 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-transparent border border-white/10 text-foreground"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label
                      htmlFor="signup-email"
                      className="text-sm font-medium"
                    >
                      Email
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="vas@email.cz"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="pl-10 h-12 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-transparent border border-white/10 text-foreground"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label
                      htmlFor="signup-password"
                      className="text-sm font-medium"
                    >
                      Heslo
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="pl-10 h-12 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-transparent border border-white/10 text-foreground"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
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
                        className="bg-red-500/10 text-red-400 text-sm p-4 rounded-xl flex items-start gap-2 border border-red-500/20"
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
                        className="bg-green-500/10 text-green-400 text-sm p-4 rounded-xl flex items-start gap-2 border border-green-500/20"
                      >
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                      disabled={isSigningUp}
                    >
                      {isSigningUp ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <User className="h-4 w-4 mr-2" />
                      )}
                      Vytvořit účet
                    </Button>
                  </motion.div>
                </form>

                <motion.div variants={itemVariants} className="mt-8">
                  <div className="text-center text-xs text-muted-foreground">
                    Registrací souhlasíte s{" "}
                    <Link
                      href="/terms"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      podmínkami použití
                    </Link>{" "}
                    eČtenářáku
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}
