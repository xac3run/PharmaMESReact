import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import Batches from "./components/Batches";
import Templates from "./components/Templates";
import Workflow from "./components/Workflow";
import Equipment from "./components/Equipment";
import Personnel from "./components/Personnel";
import {
  demoBatches,
  demoTemplates,
  demoWorkflow,
  demoEquipment,
  demoPersonnel,
  demoDeviations
} from "./data/demoData";

const Icons = {
  Dashboard: () => <span>📊</span>,
  Batch: () => <span>🧪</span>,
  Template: () => <span>📋</span>,
  Workflow: () => <span>🔄</span>,
  User: () => <span>👤</span>,
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [batches, setBatches] = useState(demoBatches);
  const [templates, setTemplates] = useState(demoTemplates);
  const [workflow, setWorkflow] = useState(demoWorkflow);
  const [equipment] = useState(demoEquipment);
  const [personnel] = useState(demoPersonnel);
  const [deviations, setDeviations] = useState(demoDeviations);

  return (
    <div className="p-6">
      <header className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold">N</span>
        </div>
        <h1 className="text-3xl font-bold">Nobilis.Tech MES 🚀</h1>
      </header>

      <nav className="flex space-x-4 border-b pb-2 mb-6">
        <button onClick={() => setActiveTab("dashboard")} className={activeTab === "dashboard" ? "font-bold" : ""}><Icons.Dashboard /> Dashboard</button>
        <button onClick={() => setActiveTab("batches")} className={activeTab === "batches" ? "font-bold" : ""}><Icons.Batch /> Batches</button>
        <button onClick={() => setActiveTab("templates")} className={activeTab === "templates" ? "font-bold" : ""}><Icons.Template /> eBR Templates</button>
        <button onClick={() => setActiveTab("workflow")} className={activeTab === "workflow" ? "font-bold" : ""}><Icons.Workflow /> Workflow</button>
        <button onClick={() => setActiveTab("equipment")} className={activeTab === "equipment" ? "font-bold" : ""}>⚙️ Equipment</button>
        <button onClick={() => setActiveTab("personnel")} className={activeTab === "personnel" ? "font-bold" : ""}><Icons.User /> Personnel</button>
      </nav>

      {activeTab === "dashboard" && <Dashboard batches={batches} templates={templates} />}
      {activeTab === "batches" && <Batches batches={batches} setBatches={setBatches} deviations={deviations} setDeviations={setDeviations} />}
      {activeTab === "templates" && <Templates templates={templates} />}
      {activeTab === "workflow" && <Workflow workflow={workflow} batches={batches} templates={templates} />}
      {activeTab === "equipment" && <Equipment equipment={equipment} />}
      {activeTab === "personnel" && <Personnel personnel={personnel} />}
    </div>
  );
}
