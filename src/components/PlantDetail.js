import React, { useState } from "react";
import { wateringStatus, daysUntilWatering, formatRelative, formatDate, formatDateShort, nextWateringDate, needsFertilizer, lastFertilizedDate } from "../utils";
import WaterModal from "./WaterModal";

export default function PlantDetail({ plant, onBack, onEdit, onDelete, onWater, onDeleteWatering }) {
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const status = wateringStatus(plant);
  const days = daysUntilWatering(plant);
  const next = nextWateringDate(plant);
  const fertNeeded = needsFertilizer(plant);
  const lastFert = lastFertilizedDate(plant);
  const needsWater = status === "overdue" || status === "today" || status === "never";

  const sortedLog = [...(plant.watering_log || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const allPhotos = plant.photos?.length > 0 ? plant.photos : (plant.photo ? [plant.photo] : []);

  const statusColors = {
    overdue: { text: "#c0392b", bg: "#fdf0ee", label: "Necesita agua urgente" },
    today:   { text: "#d4830a", bg: "#fef9ed", label: "¡Regar hoy!" },
    soon:    { text: "#b07d00", bg: "#fff8e1", label: "Pronto necesita agua" },
    ok:      { text: "#2d7a3f", bg: "#eef7f0", label: "Al día" },
    never:   { text: "#666",    bg: "#f0f0f0", label: "Nunca regada" },
  };
  const sc = statusColors[status];

  const handleWater = async (data) => {
    await onWater(data);
    setShowWaterModal(false);
  };

  return (
    <div style={{ paddingTop: 24 }} className="fade-in">
      {showWaterModal && (
        <WaterModal plant={plant} onConfirm={handleWater} onCancel={() => setShowWaterModal(false)} />
      )}
      {selectedPhoto && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }} onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="" style={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}

      <button className="btn btn-ghost" onClick={onBack}
        style={{ marginBottom: 20, padding: "7px 16px", fontSize: "0.85rem" }}>
        ← Volver
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="detail-grid">

        {/* Left */}
        <div>
          {/* Photo gallery */}
          {allPhotos.length > 0 ? (
            <div>
              <img src={allPhotos[0]} alt={plant.name} style={{
                width: "100%", height: 280, objectFit: "cover",
                borderRadius: 20, marginBottom: 8, cursor: "pointer",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
              }} onClick={() => setSelectedPhoto(allPhotos[0])} />
              {allPhotos.length > 1 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {allPhotos.slice(1).map((p, i) => (
                    <img key={i} src={p} alt="" onClick={() => setSelectedPhoto(p)} style={{
                      width: 60, height: 60, objectFit: "cover", borderRadius: 10, cursor: "pointer",
                      border: "2px solid var(--cream-dark)"
                    }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              height: 280, borderRadius: 20, background: "linear-gradient(135deg, #c8e6c9, #a5d6a7)",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8
            }}>
              <span style={{ fontSize: 80 }}>🪴</span>
            </div>
          )}

          {/* Status card */}
          <div style={{ background: sc.bg, borderRadius: 14, padding: "14px 18px", marginTop: 16, marginBottom: 14, border: `1.5px solid ${sc.text}22` }}>
            <div style={{ fontSize: "0.78rem", color: sc.text, fontWeight: 600, marginBottom: 3 }}>{sc.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: sc.text, fontFamily: "Playfair Display, serif" }}>
              {status === "never" ? "—" : formatRelative(days)}
            </div>
            {status !== "never" && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-light)", marginTop: 3 }}>
                Próximo: {formatDate(next)}
              </div>
            )}
          </div>

          {/* Fertilizer status */}
          {plant.fertilizer_every_n_waterings > 0 && (
            <div style={{
              background: fertNeeded ? "#fff8e1" : "var(--cream)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 14,
              border: fertNeeded ? "1.5px solid #f0c040" : "1.5px solid var(--cream-dark)"
            }}>
              <div style={{ fontSize: "0.78rem", color: fertNeeded ? "#b07d00" : "var(--text-light)", fontWeight: 600 }}>
                🌿 Abono {fertNeeded ? "— ¡toca en el próximo riego!" : "al día"}
              </div>
              {lastFert && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: 2 }}>
                  Último: {formatDate(lastFert)} · Cada {plant.fertilizer_every_n_waterings} riegos
                </div>
              )}
            </div>
          )}

          {/* Water button */}
          <button onClick={() => setShowWaterModal(true)} style={{
            width: "100%", padding: 14, borderRadius: 12, border: "none",
            background: needsWater ? "linear-gradient(135deg, #e74c3c, #c0392b)" : "linear-gradient(135deg, #4a90d9, #2d6fb5)",
            color: "white", fontFamily: "DM Sans", fontWeight: 600, fontSize: "1rem", cursor: "pointer",
            boxShadow: needsWater ? "0 4px 16px rgba(231,76,60,0.35)" : "0 4px 16px rgba(74,144,217,0.3)"
          }}>
            💧 Registrar riego
          </button>
        </div>

        {/* Right */}
        <div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.8rem", color: "var(--green-deep)", marginBottom: 2, lineHeight: 1.2 }}>
            {plant.name}
          </h1>
          {plant.plant_type && (
            <div style={{ color: "var(--text-light)", fontStyle: "italic", fontSize: "0.95rem", marginBottom: 8 }}>
              {plant.plant_type}
            </div>
          )}
          {plant.notes && (
            <p style={{ color: "var(--text-mid)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 16 }}>
              {plant.notes}
            </p>
          )}

          {/* Info rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <InfoRow icon="📅" label="Frecuencia" value={`Cada ${plant.watering_interval_days} días`} />
            <InfoRow icon="💧" label="Veces regada" value={`${sortedLog.length} veces`} />
            {plant.flowering_start && (
              <InfoRow
                icon="🌸"
                label={plant.flowering_end ? "Floración" : "En floración desde"}
                value={plant.flowering_end
                  ? `${formatDateShort(plant.flowering_start)} → ${formatDateShort(plant.flowering_end)}`
                  : formatDateShort(plant.flowering_start)}
              />
            )}
            {plant.flowering_photo && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-light)", marginBottom: 4 }}>Foto de la floración</div>
                <img src={plant.flowering_photo} alt="Floración" onClick={() => setSelectedPhoto(plant.flowering_photo)}
                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, cursor: "pointer", border: "2px solid #f8bbd0" }} />
              </div>
            )}
            <InfoRow icon="🌱" label="Añadida el" value={formatDate(plant.created_at)} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
            <button className="btn btn-ghost" onClick={onEdit} style={{ flex: 1 }}>✏️ Editar</button>
            {confirmDelete ? (
              <div style={{ display: "flex", gap: 8, flex: 1 }}>
                <button className="btn btn-danger" onClick={onDelete} style={{ flex: 1 }}>Confirmar</button>
                <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)} style={{ flex: 1 }}>Cancelar</button>
              </div>
            ) : (
              <button className="btn btn-danger" onClick={() => setConfirmDelete(true)} style={{ flex: 1 }}>🗑️ Eliminar</button>
            )}
          </div>

          {/* Watering log */}
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.1rem", color: "var(--green-deep)", marginBottom: 12 }}>
            Historial de riego ({sortedLog.length})
          </h3>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {sortedLog.length === 0 ? (
              <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>Todavía no hay registros.</p>
            ) : sortedLog.map((entry, i) => (
              <div key={entry.id} style={{
                padding: "10px 0", borderBottom: i < sortedLog.length - 1 ? "1px solid var(--cream-dark)" : "none",
                animation: "slideIn 0.3s ease both", animationDelay: `${i * 40}ms`
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                      background: i === 0 ? "#4a90d9" : "var(--green-pale)"
                    }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{formatDate(entry.date)}</span>
                        {entry.fertilized && (
                          <span style={{ fontSize: "0.72rem", background: "#fff8e1", color: "#b07d00", padding: "1px 7px", borderRadius: 100, fontWeight: 600 }}>
                            🌿 Abonada
                          </span>
                        )}
                      </div>
                      {entry.note && <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>{entry.note}</div>}
                      {entry.photos?.length > 0 && (
                        <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                          {entry.photos.map((p, j) => (
                            <img key={j} src={p} alt="" onClick={() => setSelectedPhoto(p)} style={{
                              width: 44, height: 44, objectFit: "cover", borderRadius: 6, cursor: "pointer"
                            }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => onDeleteWatering(entry.id)} style={{
                    background: "none", border: "none", color: "var(--text-light)",
                    cursor: "pointer", fontSize: "0.85rem", padding: "2px 6px", borderRadius: 6, flexShrink: 0
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) { .detail-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--cream)", borderRadius: 10 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-light)", marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}