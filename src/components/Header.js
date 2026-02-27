import React from "react";

export default function Header({ onHome, onAdd, showBack }) {
  return (
    <header style={{
      background: "white",
      borderBottom: "1px solid var(--cream-dark)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 2px 12px rgba(26,58,26,0.06)"
    }}>
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "0 16px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <button
          onClick={onHome}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10
          }}
        >
          <span style={{ fontSize: 28 }}>🌿</span>
          <span style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "1.3rem",
            fontWeight: 600,
            color: "var(--green-deep)",
            letterSpacing: "-0.01em"
          }}>
            Mis Plantas
          </span>
        </button>

        <button
          className="btn btn-primary"
          onClick={onAdd}
          style={{ gap: 6, padding: "8px 18px" }}
        >
          <span style={{ fontSize: 16 }}>＋</span>
          <span>Añadir</span>
        </button>
      </div>
    </header>
  );
}
