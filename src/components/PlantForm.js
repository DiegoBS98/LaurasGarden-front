import React, { useState } from "react";

// Comprime la imagen a maxWidth px y calidad 0-1
function compressImage(file, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

export default function PlantForm({ plant, onSave, onCancel }) {
  const isEdit = !!plant;
  const [name, setName] = useState(plant?.name || "");
  const [interval, setInterval] = useState(plant?.watering_interval_days || 7);
  const [notes, setNotes] = useState(plant?.notes || "");
  const [photo, setPhoto] = useState(plant?.photo || "");
  const [photoPreview, setPhotoPreview] = useState(plant?.photo || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setErrors(v => ({ ...v, photo: "La foto debe pesar menos de 20MB" }));
      return;
    }
    const b64 = await compressImage(file, 800, 0.75);
    setPhoto(b64);
    setPhotoPreview(b64);
    setErrors(v => ({ ...v, photo: null }));
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!interval || interval < 1 || interval > 365) e.interval = "El intervalo debe ser entre 1 y 365 días";
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
        watering_interval_days: Number(interval),
        notes: notes.trim(),
        photo,
      });
    } finally {
      setSaving(false);
    }
  };

  const presets = [
    { label: "2 días", value: 2 },
    { label: "1 semana", value: 7 },
    { label: "10 días", value: 10 },
    { label: "2 semanas", value: 14 },
    { label: "3 semanas", value: 21 },
    { label: "1 mes", value: 30 },
  ];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: 24 }} className="fade-in">
      <button className="btn btn-ghost" onClick={onCancel} style={{ marginBottom: 20, padding: "7px 16px", fontSize: "0.85rem" }}>
        ← Volver
      </button>

      <h2 style={{
        fontFamily: "Playfair Display, serif",
        fontSize: "1.8rem",
        color: "var(--green-deep)",
        marginBottom: 28
      }}>
        {isEdit ? "Editar planta" : "Nueva planta"}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Photo upload */}
        <div>
          <label style={labelStyle}>Foto</label>
          <div style={{
            border: "2px dashed var(--cream-dark)",
            borderRadius: 16,
            padding: 20,
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color 0.2s",
            position: "relative",
            overflow: "hidden"
          }}
          onClick={() => document.getElementById("photo-input").click()}>
            {photoPreview ? (
              <div>
                <img
                  src={photoPreview}
                  alt="preview"
                  style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10 }}
                />
                <div style={{ marginTop: 10, fontSize: "0.82rem", color: "var(--text-light)" }}>
                  Click para cambiar
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                <div style={{ color: "var(--text-mid)", fontSize: "0.9rem" }}>
                  Click para añadir una foto
                </div>
                <div style={{ color: "var(--text-light)", fontSize: "0.8rem", marginTop: 4 }}>
                  JPG, PNG — se comprime automáticamente
                </div>
              </div>
            )}
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              style={{ display: "none" }}
            />
          </div>
          {errors.photo && <ErrorMsg>{errors.photo}</ErrorMsg>}
        </div>

        {/* Name */}
        <div>
          <label style={labelStyle}>Nombre de la planta *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Monstera, Potus, Cactus de la esquina..."
            style={inputStyle(!!errors.name)}
          />
          {errors.name && <ErrorMsg>{errors.name}</ErrorMsg>}
        </div>

        {/* Watering interval */}
        <div>
          <label style={labelStyle}>¿Cada cuántos días regarla? *</label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {presets.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setInterval(p.value)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 100,
                  border: interval === p.value ? "none" : "1.5px solid var(--cream-dark)",
                  background: interval === p.value ? "var(--green-mid)" : "white",
                  color: interval === p.value ? "white" : "var(--text-mid)",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  fontFamily: "DM Sans",
                  transition: "all 0.2s"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="number"
              min={1}
              max={365}
              value={interval}
              onChange={e => setInterval(e.target.value)}
              style={{ ...inputStyle(!!errors.interval), width: 100, textAlign: "center", fontSize: "1.1rem" }}
            />
            <span style={{ color: "var(--text-mid)" }}>días</span>
          </div>
          {errors.interval && <ErrorMsg>{errors.interval}</ErrorMsg>}

          <div style={{
            marginTop: 10,
            padding: "10px 14px",
            background: "var(--ok-light)",
            borderRadius: 10,
            fontSize: "0.82rem",
            color: "var(--ok)"
          }}>
            💡 Si cambias este valor más tarde, el próximo riego se recalculará desde la última vez que regaste.
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Tipo de planta, ubicación, cuidados especiales..."
            rows={3}
            style={{
              ...inputStyle(false),
              resize: "vertical",
              minHeight: 90,
              lineHeight: 1.5
            }}
          />
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ flex: 1, justifyContent: "center", padding: "13px", fontSize: "1rem", borderRadius: 12 }}
          >
            {saving ? "Guardando..." : isEdit ? "✓ Guardar cambios" : "🌿 Añadir planta"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            style={{ padding: "13px 20px", borderRadius: 12 }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontWeight: 500,
  fontSize: "0.88rem",
  color: "var(--text-mid)",
  marginBottom: 8,
  letterSpacing: "0.01em"
};

const inputStyle = (hasError) => ({
  width: "100%",
  padding: "11px 14px",
  border: `1.5px solid ${hasError ? "#c0392b" : "var(--cream-dark)"}`,
  borderRadius: 10,
  fontSize: "0.95rem",
  background: "white",
  color: "var(--text-dark)",
  outline: "none",
  transition: "border-color 0.2s",
  fontFamily: "DM Sans"
});

function ErrorMsg({ children }) {
  return (
    <div style={{ color: "#c0392b", fontSize: "0.8rem", marginTop: 6 }}>
      {children}
    </div>
  );
}