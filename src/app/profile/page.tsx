"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AiCreditsDisplay from "@/components/AiCreditsDisplay";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1729] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-[#3b82f6] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-400">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[#0f1729] text-white pb-16">
      <header className="bg-[#1a2436] border-b border-[#2a3548] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                eČtenářák
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/"
                className="px-3 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Domů
              </Link>
              <Link
                href="/books"
                className="px-3 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Knihy
              </Link>
              <Link
                href="/subscription"
                className="px-3 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Předplatné
              </Link>
              <Link
                href="/profile"
                className="px-3 py-2 text-white bg-[#3b82f6] rounded-md"
              >
                Profil
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profil uživatele</h1>
          <p className="text-gray-400">Správa vašeho účtu a předplatného</p>
        </div>

        <div className="bg-[#1a2436] rounded-xl p-8 border border-[#2a3548] mb-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-[#3b82f6] rounded-full flex items-center justify-center text-2xl font-bold mr-4">
              {user.name?.charAt(0) || user.email.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-400 mb-1">Účet vytvořen</p>
              <p className="text-lg">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Poslední aktualizace</p>
              <p className="text-lg">{formatDate(user.updatedAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all"
            >
              Odhlásit se
            </button>
            <Link
              href="/change-password"
              className="px-6 py-2 bg-[#2a3548] text-white rounded-full font-medium hover:bg-[#3b4659] transition-all"
            >
              Změnit heslo
            </Link>
          </div>
        </div>

        <div className="bg-[#1a2436] rounded-xl p-8 border border-[#2a3548] mb-8">
          <h2 className="text-xl font-bold mb-6">Předplatné</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-400 mb-1">Aktuální plán</p>
              <p className="text-lg font-medium">
                {user.subscription.tier === "free"
                  ? "Free"
                  : user.subscription.tier === "basic"
                  ? "Basic"
                  : "Premium"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Platnost od</p>
              <p className="text-lg">
                {formatDate(user.subscription.startDate)}
              </p>
            </div>
            {user.subscription.tier !== "free" && (
              <>
                <div>
                  <p className="text-gray-400 mb-1">Fakturační období</p>
                  <p className="text-lg">
                    {user.subscription.isYearly ? "Ročně" : "Měsíčně"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Automatické obnovení</p>
                  <p className="text-lg">
                    {user.subscription.autoRenew ? "Zapnuto" : "Vypnuto"}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mb-6">
            <p className="text-gray-400 mb-1">AI kredity</p>
            <AiCreditsDisplay
              aiCreditsRemaining={user.subscription.aiCreditsRemaining}
              aiCreditsTotal={user.subscription.aiCreditsTotal}
              className="w-full"
            />
          </div>

          <Link
            href="/subscription"
            className="px-6 py-2 bg-[#3b82f6] text-white rounded-full font-medium hover:bg-blue-600 transition-all inline-block"
          >
            Spravovat předplatné
          </Link>
        </div>

        <div className="bg-[#1a2436] rounded-xl p-8 border border-[#2a3548]">
          <h2 className="text-xl font-bold mb-6">Nastavení soukromí</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Zasílání novinek emailem</p>
                <p className="text-gray-400 text-sm">
                  Dostávejte informace o nových funkcích a aktualizacích
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-[#2a3548] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b82f6]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Anonymní statistiky používání</p>
                <p className="text-gray-400 text-sm">
                  Pomáhá nám zlepšovat aplikaci
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-[#2a3548] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b82f6]"></div>
              </label>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#1a2436] border-t border-[#2a3548] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">eČtenářák</h3>
              <p className="text-gray-400">
                Elektronická aplikace pro správu čtenářského deníku
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Odkazy</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Domů
                  </Link>
                </li>
                <li>
                  <Link
                    href="/books"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Knihy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/subscription"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Předplatné
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
              <p className="text-gray-400">
                Máte otázky nebo potřebujete pomoc?
                <br />
                <a
                  href="mailto:info@ctenarskydeník.cz"
                  className="text-[#3b82f6] hover:underline"
                >
                  info@ctenarskydeník.cz
                </a>
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#2a3548] text-center text-gray-500">
            <p>
              &copy; {new Date().getFullYear()} eČtenářák. Všechna práva
              vyhrazena.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
