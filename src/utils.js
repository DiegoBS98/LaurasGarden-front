/**
 * Given the last watering date and the current interval,
 * compute how many days until next watering (can be negative = overdue).
 */
export function daysUntilWatering(plant) {
  const log = plant.watering_log || [];
  if (log.length === 0) return 0; // water now if never watered

  const sorted = [...log].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastDate = new Date(sorted[0].date);
  const now = new Date();

  const daysSinceLast = (now - lastDate) / (1000 * 60 * 60 * 24);
  return plant.watering_interval_days - daysSinceLast;
}

export function nextWateringDate(plant) {
  const log = plant.watering_log || [];
  if (log.length === 0) return new Date();

  const sorted = [...log].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastDate = new Date(sorted[0].date);
  const next = new Date(lastDate);
  next.setDate(next.getDate() + plant.watering_interval_days);
  return next;
}

export function lastWateredDate(plant) {
  const log = plant.watering_log || [];
  if (log.length === 0) return null;
  const sorted = [...log].sort((a, b) => new Date(b.date) - new Date(a.date));
  return new Date(sorted[0].date);
}

export function wateringStatus(plant) {
  const days = daysUntilWatering(plant);
  if (plant.watering_log.length === 0) return "never";
  if (days < 0) return "overdue";
  if (days <= 1) return "today";
  if (days <= 3) return "soon";
  return "ok";
}

export function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
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

export function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
