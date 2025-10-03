import React, { useState } from "react";
import { 
  LayoutDashboard, Beaker, FileText, GitBranch, Settings, Users, 
  LogIn, LogOut, Package, Clipboard, Monitor, Wrench
} from "lucide-react";

// Import components
import Dashboard from "./components/Dashboard";
import Batches from "./components/Batches";
import Formulas from "./components/Formulas";
import Workflows from "./components/Workflows";
import Materials from "./components/Materials";
import Equipment from "./components/Equipment";
import WorkStations from "./components/WorkStations";
import Personnel from "./components/Personnel";
import AuditTrail from "./components/AuditTrail";
import SettingsComponent from "./components/Settings";

// Import demo data
import {
  initialBatches,
  initialFormulas,
  initialMaterials,
  initialWorkflows,
  initialEquipment,
  initialWorkStations,
  initialPersonnel,
  initialShifts,
  rolePermissions as initialRolePermissions
} from "./data/demoData";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState("en");
  
  // State management
  const [batches, setBatches] = useState(initialBatches);
  const [formulas, setFormulas] = useState(initialFormulas);
  const [materials, setMaterials] = useState(initialMaterials);
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [workStations, setWorkStations] = useState(initialWorkStations);
  const [personnel, setPersonnel] = useState(initialPersonnel);
  const [shifts, setShifts] = useState(initialShifts);
  const [auditTrail, setAuditTrail] = useState([]);
  const [rolePermissions, setRolePermissions] = useState(initialRolePermissions);
  
  // UI state
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [editingFormula, setEditingFormula] = useState(null);
  const [selectedEquipmentClass, setSelectedEquipmentClass] = useState("Weighing");

  // Translation helper
  const t = (key) => {
    const translations = {
      en: {
        dashboard: "Dashboard",
        batches: "Batches",
        formulas: "Formulas",
        workflows: "Workflows",
        materials: "Materials",
        equipment: "Equipment",
        stations: "Work Stations",
        personnel: "Personnel",
        audit: "Audit Trail",
        settings: "Settings",
        logout: "Logout",
        login: "Login",
        welcome: "Nobilis.Tech MES",
        subtitle: "Manufacturing Execution System",
        loginInstructions: "Demo Login Instructions:",
        enterUsername: "Enter any username (e.g., 'John Operator')",
        chooseRole: "Choose role: Operator, QA, Master, Planner, or Admin"
      },
      ru: {
        dashboard: "Панель",
        batches: "Партии",
        formulas: "Формулы",
        workflows: "Процессы",
        materials: "Материалы",
        equipment: "Оборудование",
        stations: "Станции",
        personnel: "Персонал",
        audit: "Аудит",
        settings: "Настройки",
        logout: "Выход",
        login: "Вход",
        welcome: "Nobilis.Tech MES",
        subtitle: "Система управления производством",
        loginInstructions: "Инструкции для входа:",
        enterUsername: "Введите имя пользователя (например 'John Operator')",
        chooseRole: "Выберите роль: Operator, QA, Master, Planner или Admin"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  // Check permissions
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    return rolePermissions[currentUser.role]?.[permission] || false;
  };

  // Audit trail helper
  const addAuditEntry = (action, details, batchId = null) => {
    setAuditTrail(prev => [...prev, {
      id: Date.now(),
      action,
      details,
      user: currentUser?.name || "System",
      role: currentUser?.role || "System",
      timestamp: new Date().toISOString(),
      batchId
    }]);
  };

  // Login/Logout handlers
  const handleLogin = () => {
    const username = prompt("Enter username:");
    const role = prompt("Enter role (Operator/QA/Master/Planner/Admin):");
    if (username && role) {
      const existingUser = personnel.find(p => p.name === username);
      const user = existingUser || { 
        name: username, 
        role: role,
        allowedWorkStations: rolePermissions[role]?.allWorkStations ? [1, 2, 3] : []
      };
      setCurrentUser(user);
      addAuditEntry("User Login", `${username} logged in as ${role}`);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditEntry("User Logout", `${currentUser.name} logged out`);
      setCurrentUser(null);
    }
  };

  // Batch operations
  const startBatchProduction = (batchId, targetQty) => {
    if (!hasPermission('canStartBatch')) {
      alert("You don't have permission to start batches");
      return;
    }
    
    const batch = batches.find(b => b.id === batchId);
    const workflow = workflows.find(w => w.id === batch.workflowId);
    
    setBatches(prev => prev.map(b => 
      b.id === batchId 
        ? { 
            ...b, 
            status: "in_progress", 
            targetQuantity: targetQty, 
            currentStep: workflow.steps[0].id,
            currentStepIndex: 0,
            startedAt: new Date().toISOString(),
            startedBy: currentUser.name
          }
        : b
    ));
    addAuditEntry("Batch Started", `Batch ${batchId} started with target quantity ${targetQty}`, batchId);
  };

  const executeStep = (batchId, stepId, value, lotNumber = null) => {
    if (!hasPermission('canExecuteSteps')) {
      alert("You don't have permission to execute steps");
      return;
    }
    
    const batch = batches.find(b => b.id === batchId);
    const workflow = workflows.find(w => w.id === batch.workflowId);
    const step = workflow.steps.find(s => s.id === stepId);
    const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
    
    // Validate QC parameters
    if (step.type === "qc" && step.qcParameters) {
      const val = parseFloat(value);
      if (val < step.qcParameters.min || val > step.qcParameters.max) {
        alert(`Value ${val} is out of specification (${step.qcParameters.min}-${step.qcParameters.max}). Please register deviation.`);
        return;
      }
    }

    // Material consumption
    let materialConsumption = [...batch.materialConsumption];
    if (step.formulaBomId && step.type === "dispensing") {
      const formula = formulas.find(f => f.id === batch.formulaId);
      const bomItem = formula.bom.find(b => b.id === step.formulaBomId);
      const consumedQty = bomItem.quantity * batch.targetQuantity / 1000;
      
      materialConsumption.push({
        stepId,
        materialArticle: bomItem.materialArticle,
        quantity: consumedQty,
        unit: "g",
        lotNumber: lotNumber || "MANUAL",
        timestamp: new Date().toISOString()
      });

      setMaterials(prev => prev.map(m => {
        if (m.articleNumber === bomItem.materialArticle) {
          addAuditEntry("Material Consumed", `${m.articleNumber}: ${consumedQty}g consumed from stock`);
          return { ...m, quantity: m.quantity - consumedQty };
        }
        return m;
      }));
    }

    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        const newHistory = [...b.history, {
          stepId,
          stepName: step.name,
          value,
          lotNumber,
          completedBy: currentUser.name,
          timestamp: new Date().toISOString(),
          workStation: workStations.find(ws => ws.id === step.workStationId)?.name
        }];
        
        const nextStepIndex = stepIndex + 1;
        const progress = Math.round((newHistory.length / workflow.steps.length) * 100);
        const nextStep = workflow.steps[nextStepIndex];
        
        return {
          ...b,
          history: newHistory,
          materialConsumption,
          progress,
          currentStep: nextStep?.id || null,
          currentStepIndex: nextStepIndex,
          status: progress === 100 ? "completed" : "in_progress"
        };
      }
      return b;
    }));
    
    addAuditEntry(
      "Step Completed", 
      `Batch ${batchId} - Step: ${step.name}, Value: ${value}${lotNumber ? `, Lot: ${lotNumber}` : ''}`,
      batchId
    );
  };

  // Material operations
  const addNewMaterial = () => {
    if (!hasPermission('canManageMaterials')) {
      alert("You don't have permission to manage materials");
      return;
    }
    
    const newMaterial = {
      id: Date.now(),
      articleNumber: `MAT-${String(materials.length + 1).padStart(3, '0')}`,
      name: "New Material",
      status: "quarantine",
      quantity: 0,
      unit: "g",
      location: "Quarantine",
      expiryDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      receivedDate: new Date().toISOString().split('T')[0],
      supplier: "TBD",
      lotNumber: `LOT-${Date.now()}`
    };
    setMaterials(prev => [...prev, newMaterial]);
    addAuditEntry("Material Created", `New material ${newMaterial.articleNumber} created`);
  };

  const updateMaterialStatus = (id, status) => {
    if (!hasPermission('canValidateMaterials') && status === "validated") {
      alert("You don't have permission to validate materials");
      return;
    }
    
    setMaterials(prev => prev.map(m => 
      m.id === id ? { ...m, status } : m
    ));
    const material = materials.find(m => m.id === id);
    addAuditEntry("Material Status Changed", `${material.articleNumber} status changed to ${status}`);
  };

  // Export batch PDF
  const exportBatchPDF = (batchId, reportType) => {
    if (!hasPermission('canExportReports')) {
      alert("You don't have permission to export reports");
      return;
    }
    
    const batch = batches.find(b => b.id === batchId);
    const formula = formulas.find(f => f.id === batch.formulaId);
    const workflow = workflows.find(w => w.id === batch.workflowId);
    const batchAudit = auditTrail.filter(a => a.batchId === batchId);
    
    let content = `BATCH RECORD - ${batchId}\n\n`;
    content += `Product: ${formula.productName}\n`;
    content += `Formula: ${formula.articleNumber} v${formula.version}\n`;
    content += `Target Quantity: ${batch.targetQuantity} units\n`;
    content += `Status: ${batch.status}\n\n`;
    
    if (reportType === "full" || reportType === "history") {
      content += `\nEXECUTION HISTORY:\n`;
      batch.history.forEach((h, idx) => {
        content += `${idx+1}. ${h.stepName} - ${h.value} by ${h.completedBy} at ${new Date(h.timestamp).toLocaleString()}\n`;
      });
    }
    
    if (reportType === "full" || reportType === "materials") {
      content += `\nMATERIAL CONSUMPTION:\n`;
      batch.materialConsumption.forEach(mc => {
        content += `- ${mc.materialArticle}: ${mc.quantity} ${mc.unit} (Lot: ${mc.lotNumber})\n`;
      });
    }
    
    if (reportType === "full" || reportType === "audit") {
      content += `\nAUDIT TRAIL:\n`;
      batchAudit.forEach(a => {
        content += `${new Date(a.timestamp).toLocaleString()} - ${a.action} by ${a.user}: ${a.details}\n`;
      });
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Batch_${batchId}_${reportType}.txt`;
    a.click();
    
    addAuditEntry("Report Generated", `${reportType} report generated for batch ${batchId}`, batchId);
  };

  // Login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-white font-bold text-4xl">N</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{t('welcome')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
            <p className="font-semibold mb-1">{t('loginInstructions')}</p>
            <p>{t('enterUsername')}</p>
            <p>{t('chooseRole')}</p>
          </div>
          <button onClick={handleLogin} className="btn-primary w-full flex items-center justify-center space-x-2">
            <LogIn className="w-5 h-5" />
            <span>{t('login')}</span>
          </button>
        </div>
      </div>
    );
  }

  // Main application
  return (
    <div className="p-6 min-h-screen">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('welcome')}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700 text-right">
            <div className="font-bold">{currentUser.name}</div>
            <div className="text-xs text-gray-500">{currentUser.role}</div>
          </div>
          <button onClick={handleLogout} className="btn-secondary flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </header>

      <nav className="flex space-x-2 border-b pb-2 mb-6 overflow-x-auto">
        {[
          { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
          { id: "batches", label: t("batches"), icon: Beaker },
          { id: "formulas", label: t("formulas"), icon: FileText },
          { id: "workflows", label: t("workflows"), icon: GitBranch },
          { id: "materials", label: t("materials"), icon: Package },
          { id: "equipment", label: t("equipment"), icon: Wrench },
          { id: "stations", label: t("stations"), icon: Monitor },
          { id: "personnel", label: t("personnel"), icon: Users },
          { id: "audit", label: t("audit"), icon: Clipboard },
          { id: "settings", label: t("settings"), icon: Settings }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id ? "font-bold bg-white/30 backdrop-blur-md shadow-lg" : "hover:bg-white/20"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-6">
        {activeTab === "dashboard" && (
          <Dashboard 
            batches={batches}
            formulas={formulas}
            workflows={workflows}
            auditTrail={auditTrail}
          />
        )}

        {activeTab === "batches" && (
          <Batches
            batches={batches}
            setBatches={setBatches}
            formulas={formulas}
            workflows={workflows}
            equipment={equipment}
            workStations={workStations}
            currentUser={currentUser}
            expandedBatch={expandedBatch}
            setExpandedBatch={setExpandedBatch}
            startBatchProduction={startBatchProduction}
            executeStep={executeStep}
            exportBatchPDF={exportBatchPDF}
          />
        )}

        {activeTab === "formulas" && (
          <Formulas
            formulas={formulas}
            setFormulas={setFormulas}
            materials={materials}
            editingFormula={editingFormula}
            setEditingFormula={setEditingFormula}
            addAuditEntry={addAuditEntry}
          />
        )}

        {activeTab === "workflows" && (
          <Workflows
            workflows={workflows}
            setWorkflows={setWorkflows}
            formulas={formulas}
            equipment={equipment}
            workStations={workStations}
            addAuditEntry={addAuditEntry}
          />
        )}

        {activeTab === "materials" && (
          <Materials
            materials={materials}
            setMaterials={setMaterials}
            addNewMaterial={addNewMaterial}
            updateMaterialStatus={updateMaterialStatus}
            language={language}
          />
        )}

        {activeTab === "equipment" && (
          <Equipment
            equipment={equipment}
            selectedEquipmentClass={selectedEquipmentClass}
            setSelectedEquipmentClass={setSelectedEquipmentClass}
            language={language}
          />
        )}

        {activeTab === "stations" && (
          <WorkStations
            workStations={workStations}
            setWorkStations={setWorkStations}
            equipment={equipment}
            language={language}
          />
        )}

        {activeTab === "personnel" && (
          <Personnel
            personnel={personnel}
            setPersonnel={setPersonnel}
            workStations={workStations}
            shifts={shifts}
            setShifts={setShifts}
            addAuditEntry={addAuditEntry}
            language={language}
          />
        )}

        {activeTab === "audit" && hasPermission('canViewAudit') && (
          <AuditTrail
            auditTrail={auditTrail}
            batches={batches}
          />
        )}
        
        {activeTab === "audit" && !hasPermission('canViewAudit') && (
          <div className="glass-card text-center py-16">
            <p className="text-xl text-gray-600">You don't have permission to view audit trail</p>
          </div>
        )}

        {activeTab === "settings" && (
          <SettingsComponent
            language={language}
            setLanguage={setLanguage}
            currentUser={currentUser}
            addAuditEntry={addAuditEntry}
            rolePermissions={rolePermissions}
            setRolePermissions={setRolePermissions}
          />
        )}
      </div>
    </div>
  );
}