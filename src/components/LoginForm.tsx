"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FcGoogle } from "react-icons/fc";
import { Loader2, BookOpen, LogIn, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password) {
      setError("Prosím vyplňte všechna povinná pole");
      setLoading(false);
      return;
    }

    if (isSignUp && !name) {
      setError("Prosím vyplňte jméno");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Register new user
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Chyba při registraci");
        }

        setSuccess("Registrace proběhla úspěšně! Nyní se můžete přihlásit.");
        setIsSignUp(false);
        setPassword("");
      } else {
        // Login existing user
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        // Refresh the page to update auth state
        window.location.href = "/";
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Něco se pokazilo";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Něco se pokazilo";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full shadow-xl border-primary/10 backdrop-blur-sm bg-card/90">
        <CardHeader className="space-y-4">
          <div className="mx-auto bg-primary/10 p-3 rounded-full">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Čtenářský deník
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Přihlaste se nebo si vytvořte účet pro přístup k vašemu čtenářskému
            deníku
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="login"
            onValueChange={(value: string) => {
              setIsSignUp(value === "signup");
              setError("");
              setSuccess("");
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="login"
                className="transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Přihlášení
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Registrace
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent key="login-tab" value="login" className="mt-0">
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jannovak@example.cz"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEmail(e.target.value)
                        }
                        className="transition-all duration-200 focus:border-primary/50 bg-background/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Heslo
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPassword(e.target.value)
                        }
                        className="transition-all duration-200 focus:border-primary/50 bg-background/50"
                        required
                      />
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          key="error-message"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md">
                            {error}
                          </p>
                        </motion.div>
                      )}
                      {success && (
                        <motion.div
                          key="success-message"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-sm text-green-500 font-medium bg-green-500/10 p-3 rounded-md">
                            {success}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Button
                      type="submit"
                      className="w-full font-medium transition-all duration-300 hover:shadow-md hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogIn className="mr-2 h-4 w-4" />
                      )}
                      Přihlásit se
                    </Button>
                  </div>
                </motion.form>
              </TabsContent>

              <TabsContent key="signup-tab" value="signup" className="mt-0">
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Jméno
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Jan Novák"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setName(e.target.value)
                        }
                        className="transition-all duration-200 focus:border-primary/50 bg-background/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email-signup"
                        className="text-sm font-medium"
                      >
                        Email
                      </Label>
                      <Input
                        id="email-signup"
                        type="email"
                        placeholder="jannovak@example.cz"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEmail(e.target.value)
                        }
                        className="transition-all duration-200 focus:border-primary/50 bg-background/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="password-signup"
                        className="text-sm font-medium"
                      >
                        Heslo
                      </Label>
                      <Input
                        id="password-signup"
                        type="password"
                        placeholder="Minimálně 6 znaků"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPassword(e.target.value)
                        }
                        className="transition-all duration-200 focus:border-primary/50 bg-background/50"
                        required
                      />
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          key="error-message"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md">
                            {error}
                          </p>
                        </motion.div>
                      )}
                      {success && (
                        <motion.div
                          key="success-message"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-sm text-green-500 font-medium bg-green-500/10 p-3 rounded-md">
                            {success}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Button
                      type="submit"
                      className="w-full font-medium transition-all duration-300 hover:shadow-md hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Vytvořit účet
                    </Button>
                  </div>
                </motion.form>
              </TabsContent>
            </AnimatePresence>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                nebo pokračujte s
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full font-medium transition-all duration-300 hover:shadow-md hover:bg-background/80 hover:scale-[1.02] active:scale-[0.98] bg-background/50"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FcGoogle className="mr-2 h-5 w-5" />
            )}
            Google účtem
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
