import React, { useState } from "react";
import { LayoutDashboard, Beaker, FileText, GitBranch, Settings, Users } from "lucide-react";
import Dashboard from "./components/Dashboard";
import Batches from "./components/Batches";
import Templates from "./components/Templates";
import WorkflowComponent from "./components/Workflow";
import Equipment from "./components/Equipment";
import Personnel from "./components/Personnel";
import {
  demoBatches,
  demoTemplates,
  demoEquipment,
  demoPersonnel,
  demoDeviations
} from "./data/demoData";

const Icons = {
  Dashboard: () => <LayoutDashboard className="w-4 h-4" />,
  Batch: () => <Beaker className="w-4 h-4" />,
  Template: () => <FileText className="w-4 h-4" />,
  Workflow: () => <GitBranch className="w-4 h-4" />,
  Equipment: () => <Settings className="w-4 h-4" />,
  User: () => <Users className="w-4 h-4" />,
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [batches, setBatches] = useState(demoBatches);
  const [templates, setTemplates] = useState(demoTemplates);
  const [workflow, setWorkflow] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [equipment, setEquipment] = useState(demoEquipment);
  const [personnel, setPersonnel] = useState(demoPersonnel);
  const [deviations, setDeviations] = useState(demoDeviations);
  const [currentUser, setCurrentUser] = useState({ name: "John Doe", role: "Operator" });

  return (
    <div className="p-6">
      <header className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
          <span className="text-white font-bold text-xl">N</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Nobilis.Tech MES</h1>
      </header>

      <nav className="flex space-x-2 border-b pb-2 mb-6">
        <button 
          onClick={() => setActiveTab("dashboard")} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === "dashboard" ? "font-bold bg-white/30 backdrop-blur-md shadow-lg" : "hover:bg-white/20"}`}
        >
          <Icons.Dashboard />
          <span>Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab("batches")} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === "batches" ? "font-bold bg-white/30 backdrop-blur-md shadow-lg" : "hover:bg-white/20"}`}
        >
          <Icons.Batch />
          <span>Batches</span>
        </button>
        <button 
          onClick={() => setActiveTab("templates")} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === "templates" ? "font-bold bg-white/30 backdrop-blur-md shadow-lg" : "hover:bg-white/20"}`}
        >
          <Icons.Template />
          <span>eBR Templates</span>
        </button>
        <button 
          onClick={() => setActiveTab("workflow")} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === "workflow" ? "font-bold bg-white/30 backdrop-blur-md shadow-lg" : "hover:bg-white/20"}`}
        >
          <Icons.Workflow />
          <span>Workflow</span>
        </button>
        <button 
          onClick={() => setActiveTab("equipment")} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === "equipment" ? "font-bold bg-white/30 backdrop-blur-md shadow-lg" : "hover:bg-white/20"}`}
        >
          <Icons.Equipment />
          <span>Equipment</span>
        </button>
        <button 
          onClick={() => setActiveTab("personnel")} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === "personnel" ? "font-bold bg-white/30 backdrop-blur-md shadow-lg" : "hover:bg-white/20"}`}
        >
          <Icons.User />
          <span>Personnel</span>
        </button>
      </nav>

      {activeTab === "dashboard" && (
        <Dashboard 
          batches={batches} 
          templates={templates} 
          equipment={equipment}
          deviations={deviations}
        />
      )}
      
      {activeTab === "batches" && (
        <Batches 
          batches={batches} 
          setBatches={setBatches} 
          deviations={deviations} 
          setDeviations={setDeviations}
          currentUser={currentUser}
          workflow={workflow}
          activeWorkflow={activeWorkflow}
        />
      )}
      
      {activeTab === "templates" && (
        <Templates 
          templates={templates} 
          setTemplates={setTemplates}
        />
      )}
      
      {activeTab === "workflow" && (
        <WorkflowComponent 
          workflow={workflow}
          setWorkflow={setWorkflow}
          activeWorkflow={activeWorkflow}
          setActiveWorkflow={setActiveWorkflow}
          batches={batches}
          setBatches={setBatches}
          templates={templates}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          deviations={deviations}
          setDeviations={setDeviations}
        />
      )}
      
      {activeTab === "equipment" && (
        <Equipment 
          equipment={equipment} 
          setEquipment={setEquipment}
        />
      )}
      
      {activeTab === "personnel" && (
        <Personnel 
          personnel={personnel} 
          setPersonnel={setPersonnel}
        />
      )}
    </div>
  );
}