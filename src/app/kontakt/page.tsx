import { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Kontakt | Čtenářský Deník",
  description:
    "Kontaktujte nás s jakýmkoliv dotazem ohledně Čtenářského Deníku",
};

export default function ContactPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16 sm:py-24">
      <ContactForm />
    </div>
  );
}
