import React, { useState, useEffect } from "react";

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed || !show) return null;

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShow(false);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      left: 16,
      right: 16,
      background: "white",
      borderRadius: 16,
      padding: "16px 20px",
      boxShadow: "0 8px 40px rgba(26,58,26,0.2)",
      display: "flex",
      alignItems: "center",
      gap: 14,
      zIndex: 999,
      border: "1.5px solid var(--cream-dark)",
      animation: "fadeIn 0.4s ease both"
    }}>
      <img
        src="/logo192.png"
        alt="icono"
        style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--green-deep)" }}>
          Añadir a pantalla de inicio
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>
          Úsala como una app nativa
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setShow(false)}
          style={{
            background: "none", border: "none", color: "var(--text-light)",
            cursor: "pointer", fontSize: "1.2rem", padding: "4px 8px"
          }}
        >
          ✕
        </button>
        <button
          className="btn btn-primary"
          onClick={handleInstall}
          style={{ padding: "8px 16px", fontSize: "0.85rem" }}
        >
          Instalar
        </button>
      </div>
    </div>
  );
}
