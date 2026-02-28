import React, { useState } from "react";
import { needsFertilizer, compressImage } from "../utils";

/**
 * Modal that appears when watering a plant.
 * Allows: fertilizer toggle, note, photos.
 */
export default function WaterModal({ plant, onConfirm, onCancel }) {
  const fertNeeded = needsFertilizer(plant);
  const [fertilized, setFertilized] = useState(fertNeeded);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files);
    const compressed = await Promise.all(files.map(f => compressImage(f, 800, 0.75)));
    setPhotos(prev => [...prev, ...compressed].slice(0, 5));
  };

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm({ fertilized, note, photos });
    setSaving(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 500, padding: 16
    }} onClick={onCancel}>
      <div style={{
        background: "white", borderRadius: "20px 20px 16px 16px",
        width: "100%", maxWidth: 480, padding: 24,
        animation: "fadeIn 0.25s ease"
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>💧</span>
          <div>
            <h3 style={{ fontFamily: "Playfair Display, serif", color: "var(--green-deep)", fontSize: "1.2rem" }}>
              Registrar riego
            </h3>
            <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>{plant.name}</div>
          </div>
        </div>

        {/* Fertilizer toggle */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderRadius: 12,
          background: fertilized ? "#fff8e1" : "var(--cream)",
          marginBottom: 16, cursor: "pointer",
          border: fertilized ? "1.5px solid #f0c040" : "1.5px solid var(--cream-dark)"
        }} onClick={() => setFertilized(v => !v)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🌿</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>¿Has abonado?</div>
              {fertNeeded && !fertilized && (
                <div style={{ fontSize: "0.75rem", color: "#b07d00" }}>¡Toca abonar en este riego!</div>
              )}
            </div>
          </div>
          <div style={{
            width: 44, height: 26, borderRadius: 13,
            background: fertilized ? "var(--green-mid)" : "#ddd",
            position: "relative", transition: "background 0.2s"
          }}>
            <div style={{
              position: "absolute", top: 3, left: fertilized ? 21 : 3,
              width: 20, height: 20, borderRadius: "50%", background: "white",
              transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
            }} />
          </div>
        </div>

        {/* Note */}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Nota opcional (estado de la planta, observaciones...)"
          rows={2}
          style={{
            width: "100%", padding: "10px 14px", border: "1.5px solid var(--cream-dark)",
            borderRadius: 10, fontSize: "0.9rem", fontFamily: "DM Sans",
            resize: "none", marginBottom: 16, outline: "none"
          }}
        />

        {/* Photos */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-mid)", marginBottom: 8 }}>
            Fotos del riego (opcional)
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={p} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />
                <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} style={{
                  position: "absolute", top: -6, right: -6, width: 20, height: 20,
                  borderRadius: "50%", background: "#c0392b", color: "white",
                  border: "none", fontSize: "0.7rem", cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center"
                }}>✕</button>
              </div>
            ))}
            {photos.length < 5 && (
              <label style={{
                width: 64, height: 64, border: "2px dashed var(--cream-dark)",
                borderRadius: 8, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", fontSize: 22
              }}>
                📷
                <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: "none" }} />
              </label>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={saving} style={{
            flex: 2, padding: "12px", borderRadius: 100, border: "none",
            background: "linear-gradient(135deg, #4a90d9, #2d6fb5)",
            color: "white", fontFamily: "DM Sans", fontWeight: 600,
            fontSize: "1rem", cursor: "pointer"
          }}>
            {saving ? "Guardando..." : "💧 Confirmar riego"}
          </button>
        </div>
      </div>
    </div>
  );
}