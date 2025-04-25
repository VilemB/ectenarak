import * as React from "react";

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail: React.FC<Readonly<WelcomeEmailProps>> = ({
  name,
}) => (
  <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        padding: "30px",
        border: "1px solid #eee",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h1
        style={{
          color: "#333",
          borderBottom: "1px solid #eee",
          paddingBottom: "10px",
        }}
      >
        Vítejte v eČtenářáku, {name}!
      </h1>
      <p style={{ color: "#555" }}>
        Jsme nadšeni, že jste se k nám připojili. eČtenářák je váš nový
        digitální společník pro správu vaší četby a objevování nových
        literárních světů.
      </p>
      <p style={{ color: "#555" }}>Co můžete dělat:</p>
      <ul style={{ color: "#555", paddingLeft: "20px" }}>
        <li>Přidávat a spravovat své přečtené knihy.</li>
        <li>Generovat si zápisky a shrnutí pomocí AI.</li>
        <li>Sledovat svůj čtenářský pokrok.</li>
        <li>Objevovat doporučení na základě vašich preferencí (již brzy!).</li>
      </ul>
      <p style={{ color: "#555" }}>
        Neváhejte se přihlásit a začít prozkoumávat všechny funkce. Pokud budete
        mít jakékoli otázky, naše podpora je vám k dispozici.
      </p>
      <a
        href={process.env.NEXTAUTH_URL || "http://localhost:3000"} // Fallback for local dev
        style={{
          display: "inline-block",
          padding: "12px 25px",
          marginTop: "15px",
          backgroundColor: "#007bff",
          color: "#ffffff",
          textDecoration: "none",
          borderRadius: "5px",
          fontWeight: "bold",
        }}
      >
        Přejít do aplikace
      </a>
      <p style={{ marginTop: "25px", fontSize: "0.9em", color: "#888" }}>
        Šťastné čtení,
        <br />
        Tým eČtenářáku
      </p>
    </div>
  </div>
);

export default WelcomeEmail;
