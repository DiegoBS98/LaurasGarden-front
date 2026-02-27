import React, { useState } from "react";
import { wateringStatus, daysUntilWatering, formatRelative, lastWateredDate, formatDate } from "../utils";

const STATUS_CONFIG = {
  overdue: { label: "Atrasada", icon: "💧", color: "#c0392b", bg: "#fdf0ee" },
  today: { label: "¡Hoy!", icon: "💧", color: "#d4830a", bg: "#fef9ed" },
  soon: { label: "Pronto", icon: "🌱", color: "#b07d00", bg: "#fff8e1" },
  ok: { label: "Al día", icon: "✓", color: "#2d7a3f", bg: "#eef7f0" },
  never: { label: "Sin regar", icon: "🌵", color: "#888", bg: "#f0f0f0" },
};

export default function Dashboard({ plants, onSelectPlant, onAdd, onWater }) {
  const [watering, setWatering] = useState(null);
  const [filter, setFilter] = useState("all");

  const needWater = plants.filter(p => {
    const s = wateringStatus(p);
    return s === "overdue" || s === "today" || s === "never";
  });

  const filtered = filter === "all" ? plants
    : filter === "needs" ? needWater
    : plants.filter(p => wateringStatus(p) === filter);

  const handleWater = async (e, plantId) => {
    e.stopPropagation();
    setWatering(plantId);
    try { await onWater(plantId); } finally { setWatering(null); }
  };

  return (
    <div style={{ paddingTop: 32 }}>
      {/* Hero summary */}
      {needWater.length > 0 && (
        <div className="fade-in" style={{
          background: "linear-gradient(135deg, var(--green-mid), var(--green-deep))",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 32,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "0 6px 32px rgba(45,90,39,0.3)"
        }}>
          <div>
            <div style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: 4 }}>Hoy necesitan agua</div>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "2rem", fontWeight: 600 }}>
              {needWater.length} {needWater.length === 1 ? "planta" : "plantas"}
            </div>
          </div>
          <div style={{ fontSize: 48 }}>💧</div>
        </div>
      )}

      {plants.length === 0 ? (
        <EmptyState onAdd={onAdd} />
      ) : (
        <>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { key: "all", label: "Todas" },
              { key: "needs", label: `Necesitan agua (${needWater.length})` },
              { key: "ok", label: "Al día" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 100,
                  border: filter === f.key ? "none" : "1.5px solid var(--cream-dark)",
                  background: filter === f.key ? "var(--green-mid)" : "white",
                  color: filter === f.key ? "white" : "var(--text-mid)",
                  fontFamily: "DM Sans",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20
          }}>
            {filtered.map((plant, i) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                index={i}
                onClick={() => onSelectPlant(plant)}
                onWater={(e) => handleWater(e, plant.id)}
                isWatering={watering === plant.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PlantCard({ plant, index, onClick, onWater, isWatering }) {
  const status = wateringStatus(plant);
  const days = daysUntilWatering(plant);
  const cfg = STATUS_CONFIG[status];
  const last = lastWateredDate(plant);

  return (
    <div
      className="card fade-in"
      onClick={onClick}
      style={{
        cursor: "pointer",
        animationDelay: `${index * 60}ms`,
        border: (status === "overdue" || status === "never")
          ? `2px solid rgba(192,57,43,0.2)` : "2px solid transparent"
      }}
    >
      {/* Photo */}
      <div style={{
        height: 180,
        background: plant.photo
          ? `url(${plant.photo}) center/cover`
          : `linear-gradient(135deg, ${lightenColor(index)})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}>
        {!plant.photo && (
          <span style={{ fontSize: 56, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>🪴</span>
        )}
        {/* Status badge on photo */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: cfg.bg, color: cfg.color,
          borderRadius: 100, padding: "3px 10px",
          fontSize: "0.75rem", fontWeight: 600,
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", gap: 4
        }}>
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "16px 18px 18px" }}>
        <h3 style={{
          fontFamily: "Playfair Display, serif",
          fontSize: "1.15rem",
          fontWeight: 600,
          marginBottom: 4,
          color: "var(--green-deep)"
        }}>
          {plant.name}
        </h3>

        <div style={{
          fontSize: "0.85rem",
          color: cfg.color,
          fontWeight: 500,
          marginBottom: 12
        }}>
          {status === "never" ? "Nunca regada" : formatRelative(days)}
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>
            Cada {plant.watering_interval_days} días
            {last && <div>Último: {formatDate(last)}</div>}
          </div>

          <button
            className="btn btn-water"
            onClick={onWater}
            disabled={isWatering}
            style={{ padding: "7px 14px", fontSize: "0.82rem", opacity: isWatering ? 0.7 : 1 }}
          >
            {isWatering ? "..." : "💧 Regar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="fade-in" style={{
      textAlign: "center",
      padding: "80px 20px",
      color: "var(--text-light)"
    }}>
      <div style={{ fontSize: 80, marginBottom: 20 }}>🌱</div>
      <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--green-deep)", marginBottom: 8 }}>
        Tu jardín está vacío
      </h2>
      <p style={{ marginBottom: 28, maxWidth: 300, margin: "0 auto 28px" }}>
        Añade tu primera planta para empezar a hacer seguimiento del riego.
      </p>
      <button className="btn btn-primary" onClick={onAdd} style={{ padding: "12px 28px" }}>
        🌿 Añadir mi primera planta
      </button>
    </div>
  );
}

const PALETTES = [
  "#c8e6c9, #a5d6a7",
  "#b2dfdb, #80cbc4",
  "#dcedc8, #c5e1a5",
  "#d7ccc8, #bcaaa4",
  "#e1bee7, #ce93d8",
  "#ffe0b2, #ffcc80",
];

function lightenColor(i) {
  return PALETTES[i % PALETTES.length];
}
