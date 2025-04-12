"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      toast({
        title: "Zpráva odeslána",
        description: "Děkujeme za vaši zprávu. Odpovím vám co nejdříve.",
      });

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se odeslat zprávu. Zkuste to prosím později.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Kontakt
        </h1>
        <p className="text-muted-foreground text-lg">
          Máte otázky nebo připomínky? Rád vám pomohu!
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card glass-card-hover group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-amber-500/10 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Mail className="h-5 w-5 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold group-hover:text-amber-500 transition-colors duration-300">
                Email
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Nejlepší způsob, jak mě kontaktovat. Odpovídám obvykle do 24
              hodin.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full group"
              asChild
            >
              <Link href="mailto:barnetv7@gmail.com">
                <Mail className="mr-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                barnetv7@gmail.com
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card glass-card-hover group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-amber-500/10 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Github className="h-5 w-5 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold group-hover:text-amber-500 transition-colors duration-300">
                GitHub
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Prozkoumejte mé další projekty a zdrojový kód na GitHubu.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full group"
              asChild
            >
              <Link
                href="https://github.com/VilemB"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                VilemB
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card glass-card-hover p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">
          Máte otázku nebo jste našli chybu? Napište mi!
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Jméno
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-muted border border-input rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-muted border border-input rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">
              Předmět
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-muted border border-input rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Zpráva
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 bg-muted border border-input rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            ></textarea>
          </div>

          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Odesílání..." : "Odeslat zprávu"}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
