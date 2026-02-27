import React, { useState } from "react";
import { wateringStatus, daysUntilWatering, formatRelative, formatDate, nextWateringDate } from "../utils";

export default function PlantDetail({ plant, onBack, onEdit, onDelete, onWater, onDeleteWatering }) {
  const [watering, setWatering] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showWaterLog, setShowWaterLog] = useState(true);

  const status = wateringStatus(plant);
  const days = daysUntilWatering(plant);
  const next = nextWateringDate(plant);
  const sortedLog = [...(plant.watering_log || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const handleWater = async () => {
    setWatering(true);
    try { await onWater(); } finally { setWatering(false); }
  };

  const statusColors = {
    overdue: { text: "#c0392b", bg: "#fdf0ee", label: "Necesita agua urgente" },
    today: { text: "#d4830a", bg: "#fef9ed", label: "¡Regar hoy!" },
    soon: { text: "#b07d00", bg: "#fff8e1", label: "Pronto necesita agua" },
    ok: { text: "#2d7a3f", bg: "#eef7f0", label: "Al día" },
    never: { text: "#666", bg: "#f0f0f0", label: "Nunca regada" },
  };
  const sc = statusColors[status];

  return (
    <div style={{ paddingTop: 24 }} className="fade-in">
      {/* Back */}
      <button
        className="btn btn-ghost"
        onClick={onBack}
        style={{ marginBottom: 20, padding: "7px 16px", fontSize: "0.85rem" }}
      >
        ← Volver
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
        className="detail-grid">

        {/* Left: Photo + actions */}
        <div>
          <div style={{
            borderRadius: 20,
            overflow: "hidden",
            height: 320,
            background: plant.photo
              ? `url(${plant.photo}) center/cover`
              : "linear-gradient(135deg, #c8e6c9, #a5d6a7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
          }}>
            {!plant.photo && <span style={{ fontSize: 80 }}>🪴</span>}
          </div>

          {/* Status card */}
          <div style={{
            background: sc.bg,
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 16,
            border: `1.5px solid ${sc.text}22`
          }}>
            <div style={{ fontSize: "0.8rem", color: sc.text, fontWeight: 600, marginBottom: 4 }}>
              {sc.label}
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: sc.text, fontFamily: "Playfair Display, serif" }}>
              {status === "never" ? "—" : formatRelative(days)}
            </div>
            {status !== "never" && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: 4 }}>
                Próximo riego: {formatDate(next)}
              </div>
            )}
          </div>

          {/* Water button */}
          <button
            className="btn btn-water"
            onClick={handleWater}
            disabled={watering}
            style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "1rem", borderRadius: 12 }}
          >
            {watering ? "Regando..." : "💧 Marcar como regada"}
          </button>
        </div>

        {/* Right: Info */}
        <div>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "2rem",
              color: "var(--green-deep)",
              marginBottom: 4,
              lineHeight: 1.2
            }}>
              {plant.name}
            </h1>
            {plant.notes && (
              <p style={{ color: "var(--text-mid)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                {plant.notes}
              </p>
            )}
          </div>

          {/* Info pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            <InfoRow icon="📅" label="Frecuencia de riego" value={`Cada ${plant.watering_interval_days} días`} />
            <InfoRow icon="💧" label="Veces regada" value={`${sortedLog.length} veces`} />
            <InfoRow icon="🌱" label="Añadida el" value={formatDate(plant.created_at)} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
            <button className="btn btn-ghost" onClick={onEdit} style={{ flex: 1 }}>
              ✏️ Editar
            </button>
            {confirmDelete ? (
              <div style={{ display: "flex", gap: 8, flex: 1 }}>
                <button className="btn btn-danger" onClick={onDelete} style={{ flex: 1 }}>
                  Confirmar
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)} style={{ flex: 1 }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button className="btn btn-danger" onClick={() => setConfirmDelete(true)} style={{ flex: 1 }}>
                🗑️ Eliminar
              </button>
            )}
          </div>

          {/* Watering log */}
          <div>
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 12, cursor: "pointer"
              }}
              onClick={() => setShowWaterLog(v => !v)}
            >
              <h3 style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "1.1rem",
                color: "var(--green-deep)"
              }}>
                Historial de riego ({sortedLog.length})
              </h3>
              <span style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>
                {showWaterLog ? "▲" : "▼"}
              </span>
            </div>

            {showWaterLog && (
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {sortedLog.length === 0 ? (
                  <p style={{ color: "var(--text-light)", fontSize: "0.9rem", padding: "12px 0" }}>
                    Todavía no hay registros de riego.
                  </p>
                ) : (
                  sortedLog.map((entry, i) => (
                    <div
                      key={entry.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: i < sortedLog.length - 1 ? "1px solid var(--cream-dark)" : "none",
                        animation: "slideIn 0.3s ease both",
                        animationDelay: `${i * 40}ms`
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: i === 0 ? "#4a90d9" : "var(--green-pale)",
                          flexShrink: 0
                        }} />
                        <div>
                          <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                            {formatDate(entry.date)}
                          </div>
                          {entry.note && (
                            <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>
                              {entry.note}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteWatering(entry.id)}
                        style={{
                          background: "none", border: "none",
                          color: "var(--text-light)", cursor: "pointer",
                          fontSize: "0.85rem", padding: "4px 8px",
                          borderRadius: 6, transition: "all 0.2s"
                        }}
                        title="Eliminar registro"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      background: "var(--cream)",
      borderRadius: 10
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-dark)" }}>{value}</div>
      </div>
    </div>
  );
}
