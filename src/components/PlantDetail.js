import React, { useState, useRef } from "react";
import { wateringStatus, daysUntilWatering, formatRelative, formatDate, formatDateShort, nextWateringDate, needsFertilizer, lastFertilizedDate } from "../utils";
import WaterModal from "./WaterModal";

export default function PlantDetail({ plant, onBack, onEdit, onDelete, onWater, onDeleteWatering, onUpdate, onUpdateWatering }) {
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // info | gallery | log
  const [savingFlowering, setSavingFlowering] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchStartX = useRef(null);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState(false);

  const status = wateringStatus(plant);
  const days = daysUntilWatering(plant);
  const next = nextWateringDate(plant);
  const fertNeeded = needsFertilizer(plant);
  const lastFert = lastFertilizedDate(plant);
  const needsWater = status === "overdue" || status === "today" || status === "never";
  const isFlowering = plant.flowering_start && !plant.flowering_end;
  const hasFlowered = plant.flowering_start && plant.flowering_end;

  const sortedLog = [...(plant.watering_log || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const fertLog = sortedLog.filter(e => e.fertilized);
  const mainPhotos = plant.photos?.length > 0 ? plant.photos : (plant.photo ? [plant.photo] : []);
  // All photos for the swiper (main + flowering + watering)
  const swiperPhotos = [
    ...mainPhotos.map(p => ({ src: p, label: "Planta" })),
    ...(plant.flowering_photo ? [{ src: plant.flowering_photo, label: "🌸 Floración" }] : []),
    ...sortedLog.flatMap(e => (e.photos || []).map(p => ({ src: p, label: `💧 ${formatDate(e.date)}` }))),
  ];

  // All photos: main + flowering + watering log photos
  const allGalleryPhotos = [
    ...mainPhotos.map(p => ({ src: p, label: "Planta", date: plant.created_at })),
    ...(plant.flowering_photo ? [{ src: plant.flowering_photo, label: "🌸 Floración", date: plant.flowering_start }] : []),
    ...sortedLog.flatMap(e => (e.photos || []).map(p => ({ src: p, label: "💧 Riego", date: e.date }))),
  ];

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

  const handleStartFlowering = async () => {
    setSavingFlowering(true);
    await onUpdate({ flowering_start: new Date().toISOString(), flowering_end: "" });
    setSavingFlowering(false);
  };

  const handleEndFlowering = async () => {
    setSavingFlowering(true);
    await onUpdate({ flowering_end: new Date().toISOString() });
    setSavingFlowering(false);
  };

  const handleClearFlowering = async () => {
    setSavingFlowering(true);
    await onUpdate({ flowering_start: "", flowering_end: "", flowering_photo: "" });
    setSavingFlowering(false);
  };

  const handleDeleteMainPhoto = async (indexToDelete) => {
    const newPhotos = mainPhotos.filter((_, i) => i !== indexToDelete);
    await onUpdate({ photos: newPhotos });
    setPhotoIndex(Math.max(0, photoIndex - 1));
    setConfirmDeletePhoto(false);
  };

  const handleDeleteFloweringPhoto = async () => {
    await onUpdate({ flowering_photo: "" });
    setConfirmDeletePhoto(false);
  };

  // Determine if current swiper photo is deletable and what type
  const currentSwiperPhoto = swiperPhotos[photoIndex];
  const currentIsMainPhoto = currentSwiperPhoto?.label === "Planta";
  const currentMainPhotoIndex = currentIsMainPhoto
    ? mainPhotos.indexOf(mainPhotos.find(p => p === currentSwiperPhoto?.src))
    : -1;
  const currentIsFloweringPhoto = currentSwiperPhoto?.label === "🌸 Floración";
  const currentIsDeletable = currentIsMainPhoto || currentIsFloweringPhoto;

  return (
    <div style={{ paddingTop: 24 }} className="fade-in">
      {showWaterModal && (
        <WaterModal plant={plant} onConfirm={handleWater} onCancel={() => setShowWaterModal(false)} />
      )}
      {selectedPhoto && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", zIndex: 1000, padding: 20, gap: 12
        }} onClick={() => { setSelectedPhoto(null); setConfirmDeletePhoto(false); }}>
          <img src={selectedPhoto.src} alt="" style={{
            maxWidth: "95vw", maxHeight: "80vh", borderRadius: 12, objectFit: "contain"
          }} />
          <div style={{ color: "white", fontSize: "0.85rem", opacity: 0.7, textAlign: "center" }}>
            <span>{selectedPhoto.label}</span>
            {selectedPhoto.date && <span> · {formatDate(selectedPhoto.date)}</span>}
          </div>
          {/* Delete button — only for main and flowering photos */}
          {(selectedPhoto.label === "Planta" || selectedPhoto.label === "🌸 Floración") && (
            <div onClick={e => e.stopPropagation()}>
              {confirmDeletePhoto ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "white", fontSize: "0.85rem" }}>¿Eliminar foto?</span>
                  <button onClick={async () => {
                    if (selectedPhoto.label === "🌸 Floración") {
                      await handleDeleteFloweringPhoto();
                    } else {
                      const idx = mainPhotos.findIndex(p => p === selectedPhoto.src);
                      await handleDeleteMainPhoto(idx);
                    }
                    setSelectedPhoto(null);
                  }} style={{
                    padding: "6px 16px", borderRadius: 100, border: "none",
                    background: "#e74c3c", color: "white", fontFamily: "DM Sans",
                    fontWeight: 600, cursor: "pointer", fontSize: "0.85rem"
                  }}>Eliminar</button>
                  <button onClick={() => setConfirmDeletePhoto(false)} style={{
                    padding: "6px 16px", borderRadius: 100,
                    border: "1.5px solid rgba(255,255,255,0.4)", background: "transparent",
                    color: "white", fontFamily: "DM Sans", cursor: "pointer", fontSize: "0.85rem"
                  }}>Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeletePhoto(true)} style={{
                  padding: "7px 18px", borderRadius: 100,
                  border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)",
                  color: "white", fontFamily: "DM Sans", cursor: "pointer", fontSize: "0.85rem",
                  backdropFilter: "blur(4px)"
                }}>🗑️ Eliminar foto</button>
              )}
            </div>
          )}
          <div style={{ color: "white", fontSize: "0.75rem", opacity: 0.4 }}>Toca fuera para cerrar</div>
        </div>
      )}

      <button className="btn btn-ghost" onClick={onBack}
        style={{ marginBottom: 20, padding: "7px 16px", fontSize: "0.85rem" }}>
        ← Volver
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="detail-grid">

        {/* LEFT: photo + status + water */}
        <div>
          {mainPhotos.length > 0 ? (
            <div>
              {/* Swiper */}
              <div
                style={{ position: "relative", borderRadius: 20, overflow: "hidden",
                  height: 280, marginBottom: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  cursor: swiperPhotos.length > 1 ? "grab" : "pointer", userSelect: "none" }}
                onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={e => {
                  if (touchStartX.current === null) return;
                  const dx = e.changedTouches[0].clientX - touchStartX.current;
                  if (dx < -40 && photoIndex < swiperPhotos.length - 1) setPhotoIndex(i => i + 1);
                  if (dx > 40 && photoIndex > 0) setPhotoIndex(i => i - 1);
                  touchStartX.current = null;
                }}
                onMouseDown={e => { touchStartX.current = e.clientX; }}
                onMouseUp={e => {
                  if (touchStartX.current === null) return;
                  const dx = e.clientX - touchStartX.current;
                  if (Math.abs(dx) < 5) {
                    setSelectedPhoto(swiperPhotos[photoIndex]);
                  } else {
                    if (dx < -40 && photoIndex < mainPhotos.length - 1) setPhotoIndex(i => i + 1);
                    if (dx > 40 && photoIndex > 0) setPhotoIndex(i => i - 1);
                  }
                  touchStartX.current = null;
                }}
              >
                <img
                  src={swiperPhotos[photoIndex]?.src}
                  alt={plant.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover",
                    transition: "opacity 0.2s ease", display: "block" }}
                />
                {/* Prev/Next arrows */}
                {swiperPhotos.length > 1 && photoIndex > 0 && (
                  <button onClick={e => { e.stopPropagation(); setPhotoIndex(i => i - 1); }} style={{
                    position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%",
                    width: 32, height: 32, cursor: "pointer", fontSize: "1rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}>‹</button>
                )}
                {swiperPhotos.length > 1 && photoIndex < swiperPhotos.length - 1 && (
                  <button onClick={e => { e.stopPropagation(); setPhotoIndex(i => i + 1); }} style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%",
                    width: 32, height: 32, cursor: "pointer", fontSize: "1rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}>›</button>
                )}
                {/* Current photo label */}
                {swiperPhotos.length > 1 && swiperPhotos[photoIndex]?.label && (
                  <div style={{
                    position: "absolute", top: 10, left: 10,
                    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                    color: "white", borderRadius: 100, padding: "3px 10px",
                    fontSize: "0.72rem", fontWeight: 500
                  }}>
                    {swiperPhotos[photoIndex].label}
                  </div>
                )}
                {/* Dot indicators */}
                {swiperPhotos.length > 1 && (
                  <div style={{
                    position: "absolute", bottom: 10, left: 0, right: 0,
                    display: "flex", justifyContent: "center", gap: 6
                  }}>
                    {swiperPhotos.map((_, i) => (
                      <div key={i} onClick={e => { e.stopPropagation(); setPhotoIndex(i); }} style={{
                        width: i === photoIndex ? 20 : 6, height: 6,
                        borderRadius: 3, cursor: "pointer",
                        background: i === photoIndex ? "white" : "rgba(255,255,255,0.5)",
                        transition: "all 0.25s ease"
                      }} />
                    ))}
                  </div>
                )}
              </div>
              {/* Thumbnail strip */}
              {swiperPhotos.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4 }}>
                  {swiperPhotos.map((photo, i) => (
                    <img key={i} src={photo.src} alt={photo.label} title={photo.label} onClick={() => setPhotoIndex(i)} style={{
                      width: 52, height: 52, objectFit: "cover", borderRadius: 8,
                      cursor: "pointer", flexShrink: 0,
                      border: i === photoIndex ? "2px solid var(--green-mid)" : "2px solid var(--cream-dark)",
                      opacity: i === photoIndex ? 1 : 0.7,
                      transition: "all 0.2s"
                    }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              height: 280, borderRadius: 20, background: "linear-gradient(135deg, #c8e6c9, #a5d6a7)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 80 }}>🪴</span>
            </div>
          )}

          {/* Status */}
          <div style={{ background: sc.bg, borderRadius: 14, padding: "14px 18px", marginTop: 16, marginBottom: 12, border: `1.5px solid ${sc.text}22` }}>
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

          {/* Fertilizer */}
          {plant.fertilizer_every_n_waterings > 0 && (
            <div style={{
              background: fertNeeded ? "#fff8e1" : "var(--cream)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 12,
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

          {/* Flowering control */}
          <div style={{
            background: isFlowering ? "#fce4ec" : hasFlowered ? "#f3e5f5" : "var(--cream)",
            borderRadius: 12, padding: "14px 16px", marginBottom: 12,
            border: isFlowering ? "1.5px solid #f48fb1" : hasFlowered ? "1.5px solid #ce93d8" : "1.5px solid var(--cream-dark)"
          }}>
            {!plant.flowering_start ? (
              // Never flowered
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginBottom: 8 }}>
                  🌸 Floración
                </div>
                <button onClick={handleStartFlowering} disabled={savingFlowering} style={{
                  padding: "7px 16px", borderRadius: 100, border: "1.5px solid #f48fb1",
                  background: "white", color: "#c2185b", fontFamily: "DM Sans",
                  fontWeight: 500, fontSize: "0.85rem", cursor: "pointer"
                }}>
                  {savingFlowering ? "..." : "🌸 Marcar inicio de floración"}
                </button>
              </div>
            ) : isFlowering ? (
              // Currently flowering
              <div>
                <div style={{ fontSize: "0.78rem", color: "#c2185b", fontWeight: 600, marginBottom: 4 }}>
                  🌸 En floración
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-mid)", marginBottom: 10 }}>
                  Desde {formatDate(plant.flowering_start)}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={handleEndFlowering} disabled={savingFlowering} style={{
                    padding: "6px 14px", borderRadius: 100, border: "none",
                    background: "#c2185b", color: "white", fontFamily: "DM Sans",
                    fontWeight: 500, fontSize: "0.82rem", cursor: "pointer"
                  }}>
                    {savingFlowering ? "..." : "✓ Marcar fin de floración"}
                  </button>
                  <button onClick={handleClearFlowering} disabled={savingFlowering} style={{
                    padding: "6px 14px", borderRadius: 100, border: "1.5px solid #f48fb1",
                    background: "transparent", color: "#c2185b", fontFamily: "DM Sans",
                    fontSize: "0.82rem", cursor: "pointer"
                  }}>Cancelar</button>
                </div>
              </div>
            ) : (
              // Flowering ended
              <div>
                <div style={{ fontSize: "0.78rem", color: "#7b1fa2", fontWeight: 600, marginBottom: 4 }}>
                  🌸 Floración registrada
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-mid)", marginBottom: 8 }}>
                  {formatDateShort(plant.flowering_start)} → {formatDateShort(plant.flowering_end)}
                </div>
                {plant.flowering_photo && (
                  <img src={plant.flowering_photo} alt="Floración"
                    onClick={() => setSelectedPhoto({ src: plant.flowering_photo, label: "🌸 Floración", date: plant.flowering_start })}
                    style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, cursor: "pointer", marginBottom: 8, border: "2px solid #f8bbd0" }} />
                )}
                <div>
                  <button onClick={handleStartFlowering} disabled={savingFlowering} style={{
                    padding: "5px 12px", borderRadius: 100, border: "1.5px solid #ce93d8",
                    background: "transparent", color: "#7b1fa2", fontFamily: "DM Sans",
                    fontSize: "0.78rem", cursor: "pointer"
                  }}>🌸 Nueva floración</button>
                </div>
              </div>
            )}
          </div>

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

        {/* RIGHT: tabs */}
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

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--cream)", borderRadius: 10, padding: 4, flexWrap: "wrap" }}>
            {[
              { key: "info", label: "ℹ️ Info" },
              { key: "gallery", label: `🖼️ (${allGalleryPhotos.length})` },
              { key: "log", label: `💧 (${sortedLog.length})` },
              { key: "fertilizer", label: `🌿 (${fertLog.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                flex: 1, padding: "7px 4px", borderRadius: 8, border: "none",
                background: activeTab === t.key ? "white" : "transparent",
                color: activeTab === t.key ? "var(--green-deep)" : "var(--text-light)",
                fontFamily: "DM Sans", fontSize: "0.78rem", fontWeight: activeTab === t.key ? 600 : 400,
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: activeTab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
              }}>{t.label}</button>
            ))}
          </div>

          {/* Tab: Info */}
          {activeTab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <InfoRow icon="📅" label="Frecuencia" value={`Cada ${plant.watering_interval_days} días`} />
              <InfoRow icon="💧" label="Veces regada" value={`${sortedLog.length} veces`} />
              <InfoRow icon="🖼️" label="Fotos" value={`${allGalleryPhotos.length} fotos`} />
              <InfoRow icon="🌱" label="Añadida el" value={formatDate(plant.created_at)} />
              {plant.fertilizer_every_n_waterings > 0 && (
                <InfoRow icon="🌿" label="Abono" value={`Cada ${plant.fertilizer_every_n_waterings} riegos`} />
              )}
            </div>
          )}

          {/* Tab: Gallery */}
          {activeTab === "gallery" && (
            <div>
              {allGalleryPhotos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-light)" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: "0.9rem" }}>Todavía no hay fotos</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {allGalleryPhotos.map((photo, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: "1", cursor: "pointer" }}
                      onClick={() => { setSelectedPhoto(photo); setConfirmDeletePhoto(false); }}>
                      <img src={photo.src} alt="" style={{
                        width: "100%", height: "100%", objectFit: "cover", borderRadius: 8
                      }} />
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                        borderRadius: "0 0 8px 8px", padding: "4px 5px"
                      }}>
                        <div style={{ fontSize: "0.6rem", color: "white", opacity: 0.9 }}>{photo.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Watering log */}
          {activeTab === "log" && (
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {sortedLog.length === 0 ? (
                <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>Todavía no hay registros.</p>
              ) : sortedLog.map((entry, i) => (
                <div key={entry.id} style={{
                  padding: "10px 0",
                  borderBottom: i < sortedLog.length - 1 ? "1px solid var(--cream-dark)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 6,
                        background: i === 0 ? "#4a90d9" : "var(--green-pale)"
                      }} />
                      <div style={{ flex: 1 }}>
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
                          <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                            {entry.photos.map((p, j) => (
                              <div key={j} style={{ position: "relative" }}>
                                <img src={p} alt="" onClick={() => setSelectedPhoto({ src: p, label: "💧 Riego", date: entry.date })} style={{
                                  width: 44, height: 44, objectFit: "cover", borderRadius: 6, cursor: "pointer", display: "block"
                                }} />
                                <button onClick={async () => {
                                  const newPhotos = entry.photos.filter((_, k) => k !== j);
                                  await onUpdateWatering(entry.id, { photos: newPhotos });
                                }} style={{
                                  position: "absolute", top: -5, right: -5, width: 16, height: 16,
                                  borderRadius: "50%", background: "#c0392b", color: "white",
                                  border: "none", fontSize: "0.55rem", cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  lineHeight: 1
                                }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => onDeleteWatering(entry.id)} style={{
                      background: "none", border: "none", color: "var(--text-light)",
                      cursor: "pointer", fontSize: "0.85rem", padding: "2px 6px", flexShrink: 0
                    }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Fertilizer log */}
          {activeTab === "fertilizer" && (
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {plant.fertilizer_every_n_waterings > 0 ? (
                <div style={{
                  background: "var(--cream)", borderRadius: 10, padding: "10px 14px", marginBottom: 14,
                  fontSize: "0.82rem", color: "var(--text-mid)"
                }}>
                  Frecuencia configurada: cada <strong>{plant.fertilizer_every_n_waterings} riegos</strong>
                </div>
              ) : (
                <div style={{
                  background: "#fff8e1", borderRadius: 10, padding: "10px 14px", marginBottom: 14,
                  fontSize: "0.82rem", color: "#b07d00"
                }}>
                  Sin frecuencia configurada — edita la planta para activarlo
                </div>
              )}
              {fertLog.length === 0 ? (
                <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>Todavía no se ha abonado.</p>
              ) : fertLog.map((entry, i) => (
                <div key={entry.id} style={{
                  padding: "10px 0",
                  borderBottom: i < fertLog.length - 1 ? "1px solid var(--cream-dark)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: i === 0 ? "#f0c040" : "#e8d5a3"
                    }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{formatDate(entry.date)}</span>
                        <span style={{ fontSize: "0.72rem", background: "#fff8e1", color: "#b07d00", padding: "1px 7px", borderRadius: 100, fontWeight: 600 }}>
                          🌿 Abonada
                        </span>
                      </div>
                      {entry.note && <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>{entry.note}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
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