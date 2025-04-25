import * as React from "react";
import { SUBSCRIPTION_LIMITS } from "@/types/user";

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail: React.FC<Readonly<WelcomeEmailProps>> = ({
  name,
}) => (
  <div
    style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      lineHeight: 1.6,
      backgroundColor: "#f0f4f8",
      padding: "20px",
    }}
  >
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        padding: "35px",
        border: "1px solid #e0e0e0",
        borderRadius: "12px",
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
      }}
    >
      <h1
        style={{
          color: "#2c3e50", // Dark blue-grey
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: "15px",
          marginBottom: "25px",
          fontSize: "26px",
          fontWeight: "600",
        }}
      >
        Vítejte v eČtenářáku, {name}! 👋
      </h1>
      <p style={{ color: "#34495e", fontSize: "16px", marginBottom: "20px" }}>
        Jsme nadšeni, že jste se k nám připojili! eČtenářák je váš nový
        digitální společník pro správu četby a využívání AI k prohloubení vašich
        literárních zážitků.
      </p>
      <p
        style={{
          color: "#34495e",
          fontSize: "16px",
          fontWeight: "bold",
          marginBottom: "10px",
        }}
      >
        Co můžete ihned vyzkoušet:
      </p>
      <ul
        style={{
          color: "#34495e",
          paddingLeft: "25px",
          marginBottom: "25px",
          listStyleType: "'✨ '",
        }}
      >
        <li style={{ marginBottom: "10px" }}>
          <strong>Využít sílu AI:</strong> Použijte své počáteční AI kredity (
          {SUBSCRIPTION_LIMITS.free.aiCreditsPerMonth}) k automatickému
          generování shrnutí a klíčových poznatků z vašich knih.
        </li>
        <li style={{ marginBottom: "10px" }}>
          <strong>Organizovat svou četbu:</strong> Přidávejte knihy (až{" "}
          {SUBSCRIPTION_LIMITS.free.maxBooks} zdarma) a pište si k nim vlastní
          poznámky.
        </li>
        <li style={{ marginBottom: "10px" }}>
          <strong>Exportovat poznámky:</strong> Později můžete snadno exportovat
          své poznámky do PDF (funkce dostupná v placených tarifech Basic a
          Premium).
        </li>
      </ul>
      <p style={{ color: "#34495e", fontSize: "16px", marginBottom: "25px" }}>
        Přihlaste se a začněte naplno využívat všechny možnosti, které eČtenářák
        nabízí. Jsme tu pro vás, pokud byste měli jakékoli dotazy nebo
        potřebovali pomoci.
      </p>
      <div style={{ textAlign: "center" }}>
        {" "}
        {/* Center the button */}
        <a
          href={process.env.NEXTAUTH_URL || "http://localhost:3000"} // Fallback for local dev
          style={{
            display: "inline-block",
            padding: "14px 30px",
            marginTop: "15px",
            backgroundColor: "#3498db", // A nice blue
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "16px",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.3s ease", // Basic hover effect (might not work everywhere)
          }}
          // Basic hover effect using inline style (limited support in email clients)
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#2980b9")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#3498db")
          }
        >
          Přejít do aplikace eČtenářák
        </a>
      </div>
      <p
        style={{
          marginTop: "35px",
          fontSize: "14px",
          color: "#7f8c8d",
          borderTop: "1px solid #e0e0e0",
          paddingTop: "20px",
        }}
      >
        Přejeme spoustu skvělých čtenářských zážitků!
        <br />
        Váš tým eČtenářáku
      </p>
    </div>
    <p
      style={{
        textAlign: "center",
        fontSize: "12px",
        color: "#95a5a6",
        marginTop: "20px",
      }}
    >
      Tento email jste obdrželi, protože jste se zaregistrovali v aplikaci
      eČtenářák.
    </p>
  </div>
);

export default WelcomeEmail;
