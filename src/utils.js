export function daysUntilWatering(plant) {
  const log = plant.watering_log || [];
  // Use override date if no log entries
  const lastDateStr = log.length > 0
    ? [...log].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
    : plant.last_watered_override || null;

  if (!lastDateStr) return 0;

  const lastDate = new Date(lastDateStr);
  const now = new Date();
  const daysSinceLast = (now - lastDate) / (1000 * 60 * 60 * 24);
  return plant.watering_interval_days - daysSinceLast;
}

export function nextWateringDate(plant) {
  const log = plant.watering_log || [];
  const lastDateStr = log.length > 0
    ? [...log].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
    : plant.last_watered_override || null;

  if (!lastDateStr) return new Date();
  const next = new Date(lastDateStr);
  next.setDate(next.getDate() + plant.watering_interval_days);
  return next;
}

export function lastWateredDate(plant) {
  const log = plant.watering_log || [];
  if (log.length === 0) return plant.last_watered_override ? new Date(plant.last_watered_override) : null;
  const sorted = [...log].sort((a, b) => new Date(b.date) - new Date(a.date));
  return new Date(sorted[0].date);
}

export function wateringStatus(plant) {
  const log = plant.watering_log || [];
  const hasReference = log.length > 0 || plant.last_watered_override;
  if (!hasReference) return "never";
  const days = daysUntilWatering(plant);
  if (days < 0) return "overdue";
  if (days <= 1) return "today";
  if (days <= 3) return "soon";
  return "ok";
}

// Fertilizer: returns true if the next watering should include fertilizer
export function needsFertilizer(plant) {
  const n = plant.fertilizer_every_n_waterings;
  if (!n || n <= 0) return false;
  const log = plant.watering_log || [];
  if (log.length === 0) return false;
  // Count waterings since last fertilized one
  const sorted = [...log].sort((a, b) => new Date(b.date) - new Date(a.date));
  let count = 0;
  for (const entry of sorted) {
    if (entry.fertilized) break;
    count++;
  }
  // If never fertilized, count all
  const neverFertilized = !sorted.some(e => e.fertilized);
  if (neverFertilized) count = sorted.length;
  return count >= n;
}

export function lastFertilizedDate(plant) {
  const log = plant.watering_log || [];
  const fertilized = log.filter(e => e.fertilized).sort((a, b) => new Date(b.date) - new Date(a.date));
  return fertilized.length > 0 ? new Date(fertilized[0].date) : null;
}

export function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(date));
}

export function formatRelative(days) {
  if (days < 0) {
    const d = Math.abs(Math.floor(days));
    return d === 1 ? "Hace 1 día" : `Hace ${d} días`;
  }
  if (days < 1) return "¡Hoy!";
  const d = Math.floor(days);
  if (d === 1) return "Mañana";
  return `En ${d} días`;
}

export function compressImage(file, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

// Crop a square region from base64 image using canvas
export function cropImageSquare(base64, cropData) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(cropData.width, cropData.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, cropData.x, cropData.y, size, size, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = base64;
  });
}