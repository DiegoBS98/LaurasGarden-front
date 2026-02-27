import React, { useState, useEffect } from "react";
import "./index.css";
import { api } from "./api";
import Dashboard from "./components/Dashboard";
import PlantDetail from "./components/PlantDetail";
import PlantForm from "./components/PlantForm";
import Header from "./components/Header";
import InstallBanner from "./components/InstallBanner";

export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard | detail | add | edit
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlants = async () => {
    try {
      const data = await api.getPlants();
      setPlants(data);
      setError(null);
    } catch (e) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlants(); }, []);

  // Refresh selected plant when plants list changes
  useEffect(() => {
    if (selectedPlant) {
      const updated = plants.find(p => p.id === selectedPlant.id);
      if (updated) setSelectedPlant(updated);
    }
  }, [plants]); // eslint-disable-line

  const navigate = (v, plant = null) => {
    setSelectedPlant(plant);
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header
        onHome={() => navigate("dashboard")}
        onAdd={() => navigate("add")}
        showBack={view !== "dashboard"}
      />
      <InstallBanner />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 80px" }}>
        {error && (
          <div style={{
            background: "#fdf0ee", color: "#c0392b", padding: "12px 20px",
            borderRadius: 12, margin: "20px 0", fontSize: "0.9rem"
          }}>
            ⚠️ {error}
          </div>
        )}
        {view === "dashboard" && (
          <Dashboard
            plants={plants}
            onSelectPlant={(p) => navigate("detail", p)}
            onAdd={() => navigate("add")}
            onWater={async (plantId) => {
              await api.waterPlant(plantId);
              await loadPlants();
            }}
          />
        )}
        {view === "detail" && selectedPlant && (
          <PlantDetail
            plant={selectedPlant}
            onBack={() => navigate("dashboard")}
            onEdit={() => navigate("edit", selectedPlant)}
            onDelete={async () => {
              await api.deletePlant(selectedPlant.id);
              await loadPlants();
              navigate("dashboard");
            }}
            onWater={async () => {
              await api.waterPlant(selectedPlant.id);
              await loadPlants();
            }}
            onDeleteWatering={async (entryId) => {
              await api.deleteWateringEntry(selectedPlant.id, entryId);
              await loadPlants();
            }}
          />
        )}
        {view === "add" && (
          <PlantForm
            onSave={async (data) => {
              await api.createPlant(data);
              await loadPlants();
              navigate("dashboard");
            }}
            onCancel={() => navigate("dashboard")}
          />
        )}
        {view === "edit" && selectedPlant && (
          <PlantForm
            plant={selectedPlant}
            onSave={async (data) => {
              await api.updatePlant(selectedPlant.id, data);
              await loadPlants();
              navigate("detail", selectedPlant);
            }}
            onCancel={() => navigate("detail", selectedPlant)}
          />
        )}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "var(--cream)"
    }}>
      <div style={{ fontSize: 48, animation: "pulse 1.5s ease infinite" }}>🌿</div>
      <p style={{ color: "var(--text-light)", fontFamily: "DM Sans" }}>Cargando tus plantas...</p>
    </div>
  );
}
