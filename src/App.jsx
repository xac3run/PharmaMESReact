import React, { useState } from "react";
import { 
  LayoutDashboard, Beaker, FileText, GitBranch, Settings, Users, 
  LogIn, LogOut, Package, Clipboard, Monitor, Wrench, AlertTriangle,
  Book, TrendingUp, GitMerge, Shield, Droplet, Menu, X, ChevronLeft,
  FileCheck, Calculator, Lock,
  MessageSquare, Thermometer
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
import DeviationManagement from "./components/DeviationManagement";
import ComplaintHandling from "./components/ComplaintHandling";

// Import NEW GMP components
import BatchRelease from "./components/BatchRelease";
import DataIntegrityMonitor from "./components/DataIntegrityMonitor";
import YieldReconciliation from "./components/YieldReconciliation";
import CleaningValidation from "./components/CleaningValidation";
import ChangeControl from "./components/ChangeControl";
import EquipmentConfigurator from "./components/EquipmentConfigurator";
import ESignatureModal from "./components/ESignatureModal";
import EquipmentLogbook from "./components/EquipmentLogbook";
import CAPASystem from "./components/CAPASystem";
import GenealogyTracker from "./components/GenealogyTracker";
import SOPManagement from "./components/SOPManagement";
import EnvironmentalMonitoring from "./components/EnvironmentalMonitoring";

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
  rolePermissions as initialRolePermissions,
  equipmentClasses,
  initialCleaningRecords,
  initialChangeControls,
  initialCAPAs,
  initialEquipmentLogs,
  initialDeviations,
  initialComplaints,
  // ... existing
  initialSOPs,
  initialEnvRecords
} from "./data/demoData";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState("en");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
  const [cleaningRecords, setCleaningRecords] = useState(initialCleaningRecords);
  const [changes, setChanges] = useState(initialChangeControls);
  const [capas, setCapas] = useState(initialCAPAs);
  const [equipmentLogs, setEquipmentLogs] = useState(initialEquipmentLogs);
  const [equipmentClassesState, setEquipmentClassesState] = useState(equipmentClasses);
  const [deviations, setDeviations] = useState(initialDeviations);
  const [complaints, setComplaints] = useState(initialComplaints);
  const [sops, setSops] = useState(initialSOPs);
  const [envRecords, setEnvRecords] = useState(initialEnvRecords);

  // UI state
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [editingFormula, setEditingFormula] = useState(null);
  const [selectedEquipmentClass, setSelectedEquipmentClass] = useState("Weighing");
  
  // E-Signature Modal
  const [eSignatureModal, setESignatureModal] = useState({
    isOpen: false,
    action: '',
    context: '',
    onSign: null
  });

  const showESignature = (action, context, onSign) => {
    setESignatureModal({
      isOpen: true,
      action,
      context,
      onSign
    });
  };

  const closeESignature = () => {
    setESignatureModal({
      isOpen: false,
      action: '',
      context: '',
      onSign: null
    });
  };

  const handleESign = (signature) => {
    if (eSignatureModal.onSign) {
      eSignatureModal.onSign(signature);
    }
  };

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
        chooseRole: "Choose role: Operator, QA, Master, Planner, or Admin",
        production: "Production",
        quality: "Quality & Compliance",
        management: "Management",
        batchRelease: "Batch Release",
        yieldRecon: "Yield Reconciliation",
        cleaning: "Cleaning Validation",
        changeControl: "Change Control",
        capa: "CAPA System",
        genealogy: "Genealogy",
        equipmentLog: "Equipment Logbook",
        dataIntegrity: "Data Integrity",
        equipmentConfig: "Equipment Config"
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
        chooseRole: "Выберите роль: Operator, QA, Master, Planner или Admin",
        production: "Производство",
        quality: "Качество и соответствие",
        management: "Управление",
        batchRelease: "Выпуск партий",
        yieldRecon: "Сверка выхода",
        cleaning: "Валидация очистки",
        changeControl: "Контроль изменений",
        capa: "Система CAPA",
        genealogy: "Генеалогия",
        equipmentLog: "Журнал оборудования",
        dataIntegrity: "Целостность данных",
        equipmentConfig: "Конфигурация оборудования"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  // Check permissions
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
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
    
    if (step.type === "qc" && step.qcParameters) {
      const val = parseFloat(value);
      if (val < step.qcParameters.min || val > step.qcParameters.max) {
        alert(`Value ${val} is out of specification (${step.qcParameters.min}-${step.qcParameters.max}). Please register deviation.`);
        return;
      }
    }

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
      lotNumber: `LOT-${Date.now()}`,
      coa: null,
      quarantineTests: []
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

  // Batch Release
  const releaseBatch = (batchId, releaseInfo) => {
    setBatches(prev => prev.map(b => 
      b.id === batchId ? { ...b, releaseInfo, status: 'released' } : b
    ));
  };

  // Yield Reconciliation
  const updateBatchYield = (batchId, yieldData) => {
    setBatches(prev => prev.map(b => 
      b.id === batchId ? { ...b, yieldReconciliation: yieldData, actualYield: yieldData.actualYield } : b
    ));
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

  // Sidebar navigation structure
  const navigationSections = [
    {
      title: t('production'),
      items: [
        { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
        { id: "batches", label: t("batches"), icon: Beaker },
        { id: "formulas", label: t("formulas"), icon: FileText },
        { id: "workflows", label: t("workflows"), icon: GitBranch },
        { id: "materials", label: t("materials"), icon: Package },
      ]
    },
    {
      title: t('quality'),
      items: [
        { id: "batchRelease", label: t("batchRelease"), icon: FileCheck },
        { id: "yieldRecon", label: t("yieldRecon"), icon: Calculator },
        { id: "cleaning", label: t("cleaning"), icon: Droplet },
        { id: "capa", label: t("capa"), icon: TrendingUp },
        { id: "genealogy", label: t("genealogy"), icon: GitMerge },
        { id: "dataIntegrity", label: t("dataIntegrity"), icon: Shield },
        { id: "deviations", label: "Deviations", icon: AlertTriangle },
        { id: "complaints", label: "Complaints", icon: MessageSquare },
      ]
    },
    {
      title: t('management'),
      items: [
        { id: "equipment", label: t("equipment"), icon: Wrench },
        { id: "equipmentLog", label: t("equipmentLog"), icon: Book },
        { id: "stations", label: t("stations"), icon: Monitor },
        { id: "personnel", label: t("personnel"), icon: Users },
        { id: "changeControl", label: t("changeControl"), icon: AlertTriangle },
        { id: "audit", label: t("audit"), icon: Clipboard },
        { id: "settings", label: t("settings"), icon: Settings },
        // ... existing items
        { id: "sops", label: "SOPs", icon: FileText },
        { id: "environmental", label: "Environment", icon: Thermometer },
      ]
    }
  ];

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

  // Main application with sidebar
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-teal-900 to-teal-700 text-white transition-all duration-300 flex flex-col shadow-2xl`}>
        {/* Logo */}
        <div className="p-4 border-b border-teal-600 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-teal-700 font-bold text-xl">N</span>
              </div>
              <div>
                <div className="font-bold text-sm">Nobilis.Tech</div>
                <div className="text-xs text-teal-200">MES System</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {navigationSections.map((section, idx) => (
            <div key={idx} className="mb-6">
              {!sidebarCollapsed && (
                <div className="px-4 mb-2 text-xs font-semibold text-teal-300 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <nav className="space-y-1 px-2">
                {section.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-white text-teal-900 shadow-lg font-semibold' 
                          : 'hover:bg-teal-800 text-teal-100'
                      }`}
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-teal-700' : ''}`} />
                      {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-teal-600">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{currentUser.name}</div>
                <div className="text-xs text-teal-200 truncate">{currentUser.role}</div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Quick Stats Bar */}
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="glass-card text-center hover-lift">
              <div className="text-2xl font-bold text-teal-700">{batches.filter(b => b.status === 'in_progress').length}</div>
              <div className="text-xs text-gray-600">Active Batches</div>
            </div>
            <div className="glass-card text-center hover-lift">
              <div className="text-2xl font-bold text-yellow-700">{materials.filter(m => m.status === 'quarantine').length}</div>
              <div className="text-xs text-gray-600">In Quarantine</div>
            </div>
            <div className="glass-card text-center hover-lift">
              <div className="text-2xl font-bold text-blue-700">{capas.filter(c => c.status !== 'closed').length}</div>
              <div className="text-xs text-gray-600">Open CAPAs</div>
            </div>
            <div className="glass-card text-center hover-lift">
              <div className="text-2xl font-bold text-green-700">{equipment.filter(e => e.status === 'operational').length}/{equipment.length}</div>
              <div className="text-xs text-gray-600">Equipment OK</div>
            </div>
          </div>

          {/* Content Area */}
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
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
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
            {activeTab === "deviations" && (
              <DeviationManagement
                deviations={deviations}
                setDeviations={setDeviations}
                batches={batches}
                materials={materials}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                capas={capas}
                setCapas={setCapas}
                language={language}
              />
            )}
            {activeTab === "deviations" && (
              <DeviationManagement
                deviations={deviations}
                setDeviations={setDeviations}
                batches={batches}
                materials={materials}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                capas={capas}
                setCapas={setCapas}
                language={language}
              />
            )}

            {activeTab === "complaints" && (
              <ComplaintHandling
                complaints={complaints}
                setComplaints={setComplaints}
                batches={batches}
                formulas={formulas}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                capas={capas}
                setCapas={setCapas}
                language={language}
              />
            )}
            {activeTab === "sops" && (
              <SOPManagement
                sops={sops}
                setSops={setSops}
                personnel={personnel}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                language={language}
              />
            )}

            {activeTab === "environmental" && (
              <EnvironmentalMonitoring
                envRecords={envRecords}
                setEnvRecords={setEnvRecords}
                workStations={workStations}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
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

            {/* NEW COMPONENTS */}
            {activeTab === "batchRelease" && (
              <BatchRelease
                batch={batches.find(b => b.status === 'completed')}
                workflows={workflows}
                deviations={deviations}
                currentUser={currentUser}
                releaseBatch={releaseBatch}
                showESignature={showESignature}
                addAuditEntry={addAuditEntry}
              />
            )}

            {activeTab === "yieldRecon" && (
              <YieldReconciliation
                batch={batches.find(b => b.status === 'completed')}
                formula={formulas.find(f => f.id === batches.find(b => b.status === 'completed')?.formulaId)}
                updateBatchYield={updateBatchYield}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                currentUser={currentUser}
              />
            )}

            {activeTab === "cleaning" && (
              <CleaningValidation
                cleaningRecords={cleaningRecords}
                setCleaningRecords={setCleaningRecords}
                equipment={equipment}
                formulas={formulas}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                language={language}
              />
            )}

            {activeTab === "changeControl" && (
              <ChangeControl
                changes={changes}
                setChanges={setChanges}
                formulas={formulas}
                workflows={workflows}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                language={language}
              />
            )}

            {activeTab === "capa" && (
              <CAPASystem
                capas={capas}
                setCapas={setCapas}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                language={language}
              />
            )}

            {activeTab === "genealogy" && (
              <GenealogyTracker
                batches={batches}
                materials={materials}
                formulas={formulas}
                language={language}
              />
            )}

            {activeTab === "equipmentLog" && (
              <EquipmentLogbook
                equipment={equipment}
                equipmentLogs={equipmentLogs}
                setEquipmentLogs={setEquipmentLogs}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                language={language}
              />
            )}

            {activeTab === "dataIntegrity" && (
              <DataIntegrityMonitor
                auditTrail={auditTrail}
              />
            )}
          </div>
        </div>
      </div>

      {/* E-Signature Modal */}
      <ESignatureModal
        isOpen={eSignatureModal.isOpen}
        onClose={closeESignature}
        onSign={handleESign}
        action={eSignatureModal.action}
        context={eSignatureModal.context}
        currentUser={currentUser}
      />
    </div>
  );
}