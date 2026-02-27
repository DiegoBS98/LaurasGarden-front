const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function req(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  getPlants: () => req("/api/plants"),
  getPlant: (id) => req(`/api/plants/${id}`),
  createPlant: (data) => req("/api/plants", { method: "POST", body: JSON.stringify(data) }),
  updatePlant: (id, data) => req(`/api/plants/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePlant: (id) => req(`/api/plants/${id}`, { method: "DELETE" }),
  waterPlant: (id, data = {}) => req(`/api/plants/${id}/water`, { method: "POST", body: JSON.stringify(data) }),
  deleteWateringEntry: (plantId, entryId) =>
    req(`/api/plants/${plantId}/water/${entryId}`, { method: "DELETE" }),
};
