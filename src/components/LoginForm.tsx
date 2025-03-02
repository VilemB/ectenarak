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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FcGoogle } from "react-icons/fc";
import { Loader2, BookOpen, LogIn, UserPlus } from "lucide-react";

export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
          throw new Error(data.message || "Registrace se nezdařila");
        }
      }

      // Sign in
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error || "Přihlášení se nezdařilo");
      }

      // Successful login will trigger a page refresh via the session provider
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Něco se pokazilo";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Přihlášení přes Google se nezdařilo";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border/60 animate-fadeIn">
      <CardHeader className="space-y-2">
        <div className="flex justify-center mb-2">
          <BookOpen className="h-10 w-10 text-primary" />
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
          onValueChange={(value: string) => setIsSignUp(value === "signup")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="transition-all duration-200">
              Přihlášení
            </TabsTrigger>
            <TabsTrigger value="signup" className="transition-all duration-200">
              Registrace
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSubmit}>
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
                    className="transition-all duration-200 focus:border-primary/50"
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
                    className="transition-all duration-200 focus:border-primary/50"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded-md">
                    {error}
                  </p>
                )}
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
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSubmit}>
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
                    className="transition-all duration-200 focus:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="text-sm font-medium">
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
                    className="transition-all duration-200 focus:border-primary/50"
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
                    className="transition-all duration-200 focus:border-primary/50"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded-md">
                    {error}
                  </p>
                )}
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
                  Registrovat se
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="relative w-full mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 py-1 text-muted-foreground font-medium rounded-full border border-border/30">
              Nebo pokračujte s
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 h-11 font-medium transition-all duration-300 border-border/60 hover:bg-accent/20 hover:border-primary/60 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
          onClick={handleGoogleSignIn}
          disabled={loading}
          size="lg"
        >
          <FcGoogle className="h-5 w-5" />
          Google účtem
        </Button>
      </CardFooter>
    </Card>
  );
}
