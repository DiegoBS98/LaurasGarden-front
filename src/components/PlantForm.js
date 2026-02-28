import React, { useState } from "react";
import { compressImage } from "../utils";
import ImageCropper from "./ImageCropper";

export default function PlantForm({ plant, onSave, onCancel }) {
  const isEdit = !!plant;
  const [name, setName] = useState(plant?.name || "");
  const [plantType, setPlantType] = useState(plant?.plant_type || "");
  const [interval, setInterval] = useState(plant?.watering_interval_days || 7);
  const [fertInterval, setFertInterval] = useState(plant?.fertilizer_every_n_waterings || 0);
  const [notes, setNotes] = useState(plant?.notes || "");
  const [photos, setPhotos] = useState(plant?.photos || (plant?.photo ? [plant.photo] : []));
  const [lastWatered, setLastWatered] = useState(plant?.last_watered_override ? plant.last_watered_override.split("T")[0] : "");
  const [floweringStart, setFloweringStart] = useState(plant?.flowering_start ? plant.flowering_start.split("T")[0] : "");
  const [floweringEnd, setFloweringEnd] = useState(plant?.flowering_end ? plant.flowering_end.split("T")[0] : "");
  const [floweringPhoto, setFloweringPhoto] = useState(plant?.flowering_photo || "");
  const [floweringCropSrc, setFloweringCropSrc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [cropSrc, setCropSrc] = useState(null);
  const [pendingCropIndex, setPendingCropIndex] = useState(null);

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (photos.length >= 10) break;
      const b64 = await compressImage(file, 1200, 0.82);
      setCropSrc(b64);
      setPendingCropIndex(photos.length);
      break; // crop one at a time
    }
  };

  const handleCropDone = (cropped) => {
    setPhotos(prev => {
      const next = [...prev];
      if (pendingCropIndex >= next.length) next.push(cropped);
      else next[pendingCropIndex] = cropped;
      return next;
    });
    setCropSrc(null);
    setPendingCropIndex(null);
  };

  const removePhoto = (i) => setPhotos(prev => prev.filter((_, j) => j !== i));

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!interval || interval < 1 || interval > 365) e.interval = "Entre 1 y 365 días";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        plant_type: plantType.trim(),
        watering_interval_days: Number(interval),
        fertilizer_every_n_waterings: Number(fertInterval),
        notes: notes.trim(),
        photos,
        last_watered_override: lastWatered ? new Date(lastWatered).toISOString() : "",
        flowering_start: floweringStart ? new Date(floweringStart).toISOString() : "",
        flowering_end: floweringEnd ? new Date(floweringEnd).toISOString() : "",
        flowering_photo: floweringPhoto,
      });
    } finally { setSaving(false); }
  };

  const presets = [
    { label: "2 días", value: 2 }, { label: "1 semana", value: 7 },
    { label: "10 días", value: 10 }, { label: "2 semanas", value: 14 },
    { label: "3 semanas", value: 21 }, { label: "1 mes", value: 30 },
  ];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: 24 }} className="fade-in">
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onCrop={handleCropDone}
          onCancel={() => { setCropSrc(null); setPendingCropIndex(null); }}
        />
      )}

      <button className="btn btn-ghost" onClick={onCancel}
        style={{ marginBottom: 20, padding: "7px 16px", fontSize: "0.85rem" }}>
        ← Volver
      </button>

      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.8rem", color: "var(--green-deep)", marginBottom: 28 }}>
        {isEdit ? "Editar planta" : "Nueva planta"}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Photos */}
        <div>
          <label style={labelStyle}>Fotos ({photos.length}/10)</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={p} alt="" style={{
                  width: 80, height: 80, objectFit: "cover", borderRadius: 10,
                  border: i === 0 ? "2px solid var(--green-mid)" : "2px solid var(--cream-dark)"
                }} />
                {i === 0 && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "var(--green-mid)", color: "white",
                    fontSize: "0.6rem", textAlign: "center", borderRadius: "0 0 8px 8px", padding: "1px 0"
                  }}>Portada</div>
                )}
                <button type="button" onClick={() => removePhoto(i)} style={{
                  position: "absolute", top: -6, right: -6, width: 20, height: 20,
                  borderRadius: "50%", background: "#c0392b", color: "white",
                  border: "none", fontSize: "0.7rem", cursor: "pointer"
                }}>✕</button>
              </div>
            ))}
            {photos.length < 10 && (
              <label style={{
                width: 80, height: 80, border: "2px dashed var(--cream-dark)",
                borderRadius: 10, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 22, color: "var(--text-light)", gap: 2
              }}>
                <span>📷</span>
                <span style={{ fontSize: "0.6rem" }}>Añadir</span>
                <input type="file" accept="image/*" onChange={handlePhotos} style={{ display: "none" }} />
              </label>
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: 6 }}>
            La primera foto es la portada. Se recortarán en cuadrado.
          </div>
        </div>

        {/* Name */}
        <div>
          <label style={labelStyle}>Nombre *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ej: Monstera, Potus, Cactus de la esquina..."
            style={inputStyle(!!errors.name)} />
          {errors.name && <ErrorMsg>{errors.name}</ErrorMsg>}
        </div>

        {/* Plant type */}
        <div>
          <label style={labelStyle}>Tipo de planta</label>
          <input type="text" value={plantType} onChange={e => setPlantType(e.target.value)}
            placeholder="Ej: Suculenta, Helecho, Orquídea, Cactus..."
            style={inputStyle(false)} />
        </div>

        {/* Watering interval */}
        <div>
          <label style={labelStyle}>¿Cada cuántos días regarla? *</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {presets.map(p => (
              <button key={p.value} type="button" onClick={() => setInterval(p.value)} style={{
                padding: "5px 12px", borderRadius: 100,
                border: Number(interval) === p.value ? "none" : "1.5px solid var(--cream-dark)",
                background: Number(interval) === p.value ? "var(--green-mid)" : "white",
                color: Number(interval) === p.value ? "white" : "var(--text-mid)",
                fontSize: "0.82rem", cursor: "pointer", fontFamily: "DM Sans", transition: "all 0.2s"
              }}>{p.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="number" min={1} max={365} value={interval}
              onChange={e => setInterval(e.target.value)}
              style={{ ...inputStyle(!!errors.interval), width: 100, textAlign: "center", fontSize: "1.1rem" }} />
            <span style={{ color: "var(--text-mid)" }}>días</span>
          </div>
          {errors.interval && <ErrorMsg>{errors.interval}</ErrorMsg>}
        </div>

        {/* Last watered override */}
        <div>
          <label style={labelStyle}>¿Cuándo la regaste por última vez?</label>
          <input type="date" value={lastWatered} onChange={e => setLastWatered(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            style={inputStyle(false)} />
          <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: 4 }}>
            Opcional — sirve para calcular el primer riego correctamente.
          </div>
        </div>

        {/* Fertilizer */}
        <div>
          <label style={labelStyle}>🌿 Abono — ¿cada cuántos riegos?</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="number" min={0} max={100} value={fertInterval}
              onChange={e => setFertInterval(e.target.value)}
              style={{ ...inputStyle(false), width: 100, textAlign: "center", fontSize: "1.1rem" }} />
            <span style={{ color: "var(--text-mid)" }}>riegos (0 = sin recordatorio)</span>
          </div>
        </div>

        {/* Flowering */}
        <div>
          <label style={labelStyle}>🌸 Floración</label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: 4 }}>Inicio</div>
              <input type="date" value={floweringStart} onChange={e => setFloweringStart(e.target.value)}
                style={inputStyle(false)} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: 4 }}>Fin</div>
              <input type="date" value={floweringEnd} onChange={e => setFloweringEnd(e.target.value)}
                style={inputStyle(false)} />
            </div>
          </div>
          {/* Flowering photo */}
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: 6 }}>Foto de la floración</div>
            {floweringCropSrc && (
              <ImageCropper
                src={floweringCropSrc}
                onCrop={(cropped) => { setFloweringPhoto(cropped); setFloweringCropSrc(null); }}
                onCancel={() => setFloweringCropSrc(null)}
              />
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {floweringPhoto && (
                <div style={{ position: "relative" }}>
                  <img src={floweringPhoto} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} />
                  <button type="button" onClick={() => setFloweringPhoto("")} style={{
                    position: "absolute", top: -6, right: -6, width: 20, height: 20,
                    borderRadius: "50%", background: "#c0392b", color: "white",
                    border: "none", fontSize: "0.7rem", cursor: "pointer"
                  }}>✕</button>
                </div>
              )}
              <label style={{
                width: 80, height: 80, border: "2px dashed var(--cream-dark)", borderRadius: 10,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 22, color: "var(--text-light)", gap: 2
              }}>
                🌸
                <span style={{ fontSize: "0.6rem" }}>Foto</span>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const b64 = await compressImage(file, 1200, 0.82);
                  setFloweringCropSrc(b64);
                }} />
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Ubicación, cuidados especiales..."
            rows={3} style={{ ...inputStyle(false), resize: "vertical", minHeight: 80, lineHeight: 1.5 }} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}
            style={{ flex: 1, justifyContent: "center", padding: "13px", fontSize: "1rem", borderRadius: 12 }}>
            {saving ? "Guardando..." : isEdit ? "✓ Guardar cambios" : "🌿 Añadir planta"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}
            style={{ padding: "13px 20px", borderRadius: 12 }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle = { display: "block", fontWeight: 500, fontSize: "0.88rem", color: "var(--text-mid)", marginBottom: 8 };
const inputStyle = (hasError) => ({
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${hasError ? "#c0392b" : "var(--cream-dark)"}`,
  borderRadius: 10, fontSize: "0.95rem", background: "white",
  color: "var(--text-dark)", outline: "none", transition: "border-color 0.2s", fontFamily: "DM Sans"
});
function ErrorMsg({ children }) {
  return <div style={{ color: "#c0392b", fontSize: "0.8rem", marginTop: 6 }}>{children}</div>;
}