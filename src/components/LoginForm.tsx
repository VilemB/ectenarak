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

export default function LoginForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Nesprávné přihlašovací údaje. Zkuste to znovu.");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Došlo k chybě při přihlašování. Zkuste to znovu později.");
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Vyplňte prosím všechna pole.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků.");
      setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Došlo k chybě při přihlašování přes Google.");
      setIsLoading(false);
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
    <div className="w-full max-w-md mx-auto">
      <Tabs
        defaultValue="login"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="login"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
          >
            Přihlášení
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
          >
            Registrace
          </TabsTrigger>
        </TabsList>

        <div className="relative min-h-[420px]">
          {" "}
          {/* Fixed height container with relative positioning */}
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
                  className="space-y-2 text-center mb-6"
                >
                  <h3 className="text-xl font-semibold">Vítejte zpět</h3>
                  <p className="text-sm text-muted-foreground">
                    Přihlaste se ke svému účtu
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="vas@email.cz"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="flex items-center gap-2"
                      >
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Heslo
                      </Label>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                        type="button"
                      >
                        Zapomenuté heslo?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        key="error-message"
                        variants={errorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full transition-all duration-300 hover:shadow-md"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      Přihlásit se
                    </Button>
                  </motion.div>
                </form>

                <motion.div variants={itemVariants} className="mt-6">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
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
                    className="w-full transition-all duration-300 hover:shadow-md hover:bg-background"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
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
                    Google
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
                  className="space-y-2 text-center mb-6"
                >
                  <h3 className="text-xl font-semibold">Vytvořit účet</h3>
                  <p className="text-sm text-muted-foreground">
                    Zaregistrujte se a začněte používat aplikaci
                  </p>
                </motion.div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Jméno
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Vaše jméno"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label
                      htmlFor="signup-email"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="vas@email.cz"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Heslo
                    </Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-xs text-muted-foreground">
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
                        className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2"
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
                        className="bg-green-100 text-green-800 text-sm p-3 rounded-md flex items-start gap-2"
                      >
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full transition-all duration-300 hover:shadow-md"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <User className="h-4 w-4 mr-2" />
                      )}
                      Vytvořit účet
                    </Button>
                  </motion.div>
                </form>

                <motion.div variants={itemVariants} className="mt-6">
                  <div className="text-center text-xs text-muted-foreground">
                    Registrací souhlasíte s našimi{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs text-primary hover:underline"
                      type="button"
                    >
                      podmínkami použití
                    </Button>{" "}
                    a{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs text-primary hover:underline"
                      type="button"
                    >
                      zásadami ochrany osobních údajů
                    </Button>
                    .
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
