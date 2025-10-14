import React, { useState } from "react";
import { apiClient } from "./api/client";
import { 
  LayoutDashboard, Beaker, FileText, GitBranch, Settings, Users, 
  LogIn, LogOut, Package, Clipboard, Monitor, Wrench, AlertTriangle,
  Book, TrendingUp, GitMerge, Shield, Droplet, Menu, X, ChevronLeft,
  FileCheck, Calculator, Lock, MessageSquare, Thermometer, Search, FlaskConical, GraduationCap 
} from "lucide-react";

// Import components
import Dashboard from "./components/Dashboard";
import Batches from "./components/Batches";
import Formulas from "./components/Formulas";
//import Workflows from "./components/Workflows";

//import EnhancedWorkflows from "./components/EnhancedWorkflows";
import EnhancedWorkflows from "./components/workflows/EnhancedWorkflows";
import Materials from "./components/Materials";
import Equipment from "./components/Equipment";
import WorkStations from "./components/WorkStations";
import Personnel from "./components/Personnel";
import AuditTrail from "./components/AuditTrail";
import SettingsComponent from "./components/Settings";
import DeviationManagement from "./components/DeviationManagement";
import ComplaintHandling from "./components/ComplaintHandling";

// GMP Modules
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
// 🆕 добавлено:
import ProductDisposition from "./components/ProductDisposition";
import InvestigationWorkflow from "./components/InvestigationWorkflow";

import StabilityStudies from "./components/StabilityStudies";
import TrainingMatrix from "./components/TrainingMatrix";

// Demo data
import {
  initialBatches,
  initialFormulas,
  initialMaterials,
  //initialWorkflows, // УДАЛИТЬ ЭТУ СТРОКУ
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
  initialSOPs,
  initialEnvRecords,
   initialDispositions,        // 🆕 добавлено
  initialInvestigations,       // 🆕 добавлено
  initialStabilityStudies,
  initialTrainingRecords,
  updatedInitialBatches
} from "./data/demoData";

// ДОБАВИТЬ НОВЫЙ ИМПОРТ:
import { initialWorkflows } from "./components/workflows/workflowDemoData";

export default function App() {
  // ---------------- STATE ----------------
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState("en");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

 // const [batches, setBatches] = useState(initialBatches);
  const [batches, setBatches] = useState(updatedInitialBatches);
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

  const [expandedBatch, setExpandedBatch] = useState(null);
  const [editingFormula, setEditingFormula] = useState(null);
  const [selectedEquipmentClass, setSelectedEquipmentClass] = useState("Weighing");

  // 🆕 добавлены состояния для новых вкладок
  // 🆕 Новые состояния для Product Disposition и Investigation Workflow
const [dispositions, setDispositions] = useState(initialDispositions);
const [investigations, setInvestigations] = useState(initialInvestigations);

const [stabilityStudies, setStabilityStudies] = useState(initialStabilityStudies);
const [trainingRecords, setTrainingRecords] = useState(initialTrainingRecords);

  // ----------- E-SIGNATURE MODAL -----------
  const [eSignatureModal, setESignatureModal] = useState({
    isOpen: false,
    action: "",
    context: "",
    onSign: null
  });

  const showESignature = (action, context, onSign) => {
    console.log("🔥 showESignature called with:", {
      action,
      context,
      hasOnSign: !!onSign,
      currentModalState: eSignatureModal.isOpen
    });

    setESignatureModal({
      isOpen: true,
      action,
      context,
      onSign
    });

    console.log("🔥 Modal state set to open");
  };

  const closeESignature = () => {
    setESignatureModal({
      isOpen: false,
      action: "",
      context: "",
      onSign: null
    });
  };

  const handleESign = (signature) => {
    if (eSignatureModal.onSign) {
      eSignatureModal.onSign(signature);
    }
  };

  // ---------- TRANSLATION ----------
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
        equipmentConfig: "Equipment Config",
        productDisposition: "Product Disposition", // 🆕
        investigationWorkflow: "Investigation Workflow" // 🆕
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
        equipmentConfig: "Конфигурация оборудования",
        productDisposition: "Решение о продукте", // 🆕
        investigationWorkflow: "Расследования" // 🆕
      }
    };
    return translations[language]?.[key] || translations["en"][key] || key;
  };

  // -------- PERMISSIONS --------
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === "Admin") return true;

    // Разрешить просмотр аудита всем
    if (permission === "canViewAudit") return true;

    return rolePermissions[currentUser.role]?.[permission] || false;
  };

  // -------- AUDIT TRAIL --------
  const addAuditEntry = (action, details, batchId = null) => {
    setAuditTrail((prev) => [
      ...prev,
      {
        id: Date.now(),
        action,
        details,
        user: currentUser?.name || "System",
        role: currentUser?.role || "System",
        timestamp: new Date().toISOString(),
        batchId
      }
    ]);
  };

  // -------- AUTH --------
  const handleLogin = async () => {
    const username = prompt("Enter username:");
    const password = prompt("Enter password:");

    if (username && password) {
      try {
        const response = await apiClient.login(username, password);
        const user = {
          name: username,
          role: response.user?.role || "operator",
          allowedWorkStations: [1, 2, 3]
        };
        setCurrentUser(user);
        addAuditEntry("User Login", `${username} logged in as ${user.role}`);
      } catch (error) {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      addAuditEntry("User Logout", `${currentUser.name} logged out`);
      await apiClient.logout();
      setCurrentUser(null);
    }
  };
  // -------- BATCH OPERATIONS --------
  const startBatchProduction = (batchId, targetQty) => {
    if (!hasPermission("canStartBatch")) {
      alert("You don't have permission to start batches");
      return;
    }

    const batch = batches.find((b) => b.id === batchId);
    const workflow = workflows.find((w) => w.id === batch.workflowId);

    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              status: "in_progress",
              targetQuantity: targetQty,
              currentStep: workflow.steps?.[0]?.id || workflow.nodes?.find(n => n.type === 'start')?.id,
              currentStepIndex: 0,
              startedAt: new Date().toISOString(),
              startedBy: currentUser.name
            }
          : b
      )
    );
    addAuditEntry(
      "Batch Started",
      `Batch ${batchId} started with target quantity ${targetQty}`,
      batchId
    );
  };

  // -------- EXECUTE STEP (с проверками оборудования) --------
  const executeStep = (batchId, stepId, value, lotNumber = null) => {
    if (!hasPermission("canExecuteSteps")) {
      alert("You don't have permission to execute steps");
      return;
    }

    const batch = batches.find((b) => b.id === batchId);
    const workflow = workflows.find((w) => w.id === batch.workflowId);
    const step = workflow.steps?.find((s) => s.id === stepId);
    const stepIndex = workflow.steps?.findIndex((s) => s.id === stepId) || 0;

    // -------- Проверка оборудования --------
    if (step.equipmentId) {
      const stepEquipment = equipment.find((eq) => eq.id === step.equipmentId);
      if (!stepEquipment) {
        alert("Required equipment not found!");
        return;
      }

      // Проверка статуса оборудования
      if (stepEquipment.status !== "operational") {
        alert(
          `Equipment ${stepEquipment.name} is not operational (Status: ${stepEquipment.status}). Cannot execute step.`
        );
        return;
      }

      // Проверка калибровки
      if (stepEquipment.calibrationStatus === "expired") {
        alert(
          `Equipment ${stepEquipment.name} calibration expired. Please recalibrate before use.`
        );
        return;
      }

      if (stepEquipment.calibrationStatus === "due") {
        if (
          !confirm(
            `Equipment ${stepEquipment.name} calibration is due. Continue anyway?`
          )
        ) {
          return;
        }
      }

      // Отметить, что оборудование в использовании
      setEquipment((prev) =>
        prev.map((eq) =>
          eq.id === step.equipmentId
            ? { ...eq, currentBatch: batchId, status: eq.status }
            : eq
        )
      );
    }

    // -------- Проверка QC параметров --------
    if (step.type === "qc" && step.qcParameters) {
      const val = parseFloat(value);
      if (val < step.qcParameters.min || val > step.qcParameters.max) {
        alert(
          `Value ${val} is out of specification (${step.qcParameters.min}-${step.qcParameters.max}). Please register deviation.`
        );
        return;
      }
    }

    // -------- Расход материалов --------
    let materialConsumption = [...batch.materialConsumption];
    if (step.formulaBomId && step.type === "dispensing") {
      const formula = formulas.find((f) => f.id === batch.formulaId);
      const bomItem = formula.bom.find((b) => b.id === step.formulaBomId);
      const consumedQty = (bomItem.quantity * batch.targetQuantity) / 1000;

      materialConsumption.push({
        stepId,
        materialArticle: bomItem.materialArticle,
        quantity: consumedQty,
        unit: "g",
        lotNumber: lotNumber || "MANUAL",
        timestamp: new Date().toISOString()
      });

      setMaterials((prev) =>
        prev.map((m) => {
          if (m.articleNumber === bomItem.materialArticle) {
            addAuditEntry(
              "Material Consumed",
              `${m.articleNumber}: ${consumedQty}g consumed from stock`
            );
            return { ...m, quantity: m.quantity - consumedQty };
          }
          return m;
        })
      );
    }

    // -------- Обновление истории партии --------
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          const newHistory = [
            ...b.history,
            {
              stepId,
              stepName: step.name,
              value,
              lotNumber,
              completedBy: currentUser.name,
              timestamp: new Date().toISOString(),
              workStation: workStations.find(
                (ws) => ws.id === step.workStationId
              )?.name,
              equipmentUsed: step.equipmentId
                ? equipment.find((eq) => eq.id === step.equipmentId)?.name
                : null,
              equipmentParameters: step.equipmentId
                ? equipment.find((eq) => eq.id === step.equipmentId)
                    ?.customParameters
                : null
            }
          ];

          const nextStepIndex = stepIndex + 1;
          const progress = Math.round(
            (newHistory.length / workflow.steps.length) * 100
          );
          const nextStep = workflow.steps[nextStepIndex];

          // Освобождаем оборудование
          if (step.equipmentId) {
            setEquipment((prev) =>
              prev.map((eq) =>
                eq.id === step.equipmentId
                  ? { ...eq, currentBatch: null, lastBatch: batchId }
                  : eq
              )
            );
          }

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
      })
    );

    const equipmentInfo = step.equipmentId
      ? `, Equipment: ${equipment.find((eq) => eq.id === step.equipmentId)?.name}`
      : "";

    addAuditEntry(
      "Step Completed",
      `Batch ${batchId} - Step: ${step.name}, Value: ${value}${
        lotNumber ? `, Lot: ${lotNumber}` : ""
      }${equipmentInfo}`,
      batchId
    );
  };

  // -------- MATERIAL OPERATIONS --------
  const addNewMaterial = () => {
    if (!hasPermission("canManageMaterials")) {
      alert("You don't have permission to manage materials");
      return;
    }

    const newMaterial = {
      id: Date.now(),
      articleNumber: `MAT-${String(materials.length + 1).padStart(3, "0")}`,
      name: "New Material",
      status: "quarantine",
      quantity: 0,
      unit: "g",
      location: "Quarantine",
      expiryDate: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0],
      receivedDate: new Date().toISOString().split("T")[0],
      supplier: "TBD",
      lotNumber: `LOT-${Date.now()}`,
      coa: null,
      quarantineTests: []
    };
    setMaterials((prev) => [...prev, newMaterial]);
    addAuditEntry(
      "Material Created",
      `New material ${newMaterial.articleNumber} created`
    );
  };

  const updateMaterialStatus = (id, status) => {
    if (!hasPermission("canValidateMaterials") && status === "validated") {
      alert("You don't have permission to validate materials");
      return;
    }

    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
    const material = materials.find((m) => m.id === id);
    addAuditEntry(
      "Material Status Changed",
      `${material.articleNumber} status changed to ${status}`
    );
  };

  // -------- BATCH RELEASE --------
  const releaseBatch = (batchId, releaseInfo) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId ? { ...b, releaseInfo, status: "released" } : b
      )
    );
  };

  // -------- YIELD RECONCILIATION --------
  const updateBatchYield = (batchId, yieldData) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              yieldReconciliation: yieldData,
              actualYield: yieldData.actualYield
            }
          : b
      )
    );
  };

  const createStabilityStudy = (stabilityData) => {
    setStabilityStudies(prev => [...prev, stabilityData]);
    addAuditEntry("Stability Study Created", `Study for batch ${stabilityData.batchId}`);
  };
  // -------- EXPORT BATCH PDF --------
  const exportBatchPDF = (batchId, reportType) => {
    if (!hasPermission("canExportReports")) {
      alert("You don't have permission to export reports");
      return;
    }

    const batch = batches.find((b) => b.id === batchId);
    const formula = formulas.find((f) => f.id === batch.formulaId);
    const workflow = workflows.find((w) => w.id === batch.workflowId);
    const batchAudit = auditTrail.filter((a) => a.batchId === batchId);

    let content = `BATCH RECORD - ${batchId}\n\n`;
    content += `Product: ${formula.productName}\n`;
    content += `Formula: ${formula.articleNumber} v${formula.version}\n`;
    content += `Target Quantity: ${batch.targetQuantity} units\n`;
    content += `Status: ${batch.status}\n\n`;

    if (reportType === "full" || reportType === "history") {
      content += `\nEXECUTION HISTORY:\n`;
      batch.history.forEach((h, idx) => {
        content += `${idx + 1}. ${h.stepName} - ${h.value} by ${
          h.completedBy
        } at ${new Date(h.timestamp).toLocaleString()}\n`;
      });
    }

    if (reportType === "full" || reportType === "materials") {
      content += `\nMATERIAL CONSUMPTION:\n`;
      batch.materialConsumption.forEach((mc) => {
        content += `- ${mc.materialArticle}: ${mc.quantity} ${mc.unit} (Lot: ${mc.lotNumber})\n`;
      });
    }

    if (reportType === "full" || reportType === "audit") {
      content += `\nAUDIT TRAIL:\n`;
      batchAudit.forEach((a) => {
        content += `${new Date(a.timestamp).toLocaleString()} - ${
          a.action
        } by ${a.user}: ${a.details}\n`;
      });
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Batch_${batchId}_${reportType}.txt`;
    a.click();

    addAuditEntry(
      "Report Generated",
      `${reportType} report generated for batch ${batchId}`,
      batchId
    );
  };
  // -------- NAVIGATION STRUCTURE --------
  const navigationSections = [
    {
      title: t("production"),
      items: [
        { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
        { id: "batches", label: t("batches"), icon: Beaker },
        { id: "formulas", label: t("formulas"), icon: FileText },
        { id: "workflows", label: t("workflows"), icon: GitBranch },
        { id: "materials", label: t("materials"), icon: Package },
        // 🆕 добавлено:
        { id: "productDisposition", label: t("productDisposition"), icon: FileCheck },
      ],
    },
    {
      title: t("quality"),
      items: [
        { id: "investigationWorkflow", label: t("investigationWorkflow"), icon: Search }, // 🆕 новая вкладка
        { id: "batchRelease", label: t("batchRelease"), icon: FileCheck },
        { id: "yieldRecon", label: t("yieldRecon"), icon: Calculator },
        { id: "cleaning", label: t("cleaning"), icon: Droplet },
        { id: "capa", label: t("capa"), icon: TrendingUp },
        { id: "genealogy", label: t("genealogy"), icon: GitMerge },
        { id: "dataIntegrity", label: t("dataIntegrity"), icon: Shield },
        { id: "deviations", label: "Deviations", icon: AlertTriangle },
        { id: "complaints", label: "Complaints", icon: MessageSquare },
         { id: "stabilityStudies", label: "Stability Studies", icon: FlaskConical },
       { id: "trainingMatrix", label: "Training Matrix", icon: GraduationCap },
      ],
    },
    {
      title: t("management"),
      items: [
        { id: "equipment", label: t("equipment"), icon: Wrench },
        { id: "equipmentConfig", label: t("equipmentConfig"), icon: Settings }, // ДОБАВИТЬ ЭТУ СТРОКУ
        { id: "equipmentLog", label: t("equipmentLog"), icon: Book },
        { id: "stations", label: t("stations"), icon: Monitor },
        { id: "personnel", label: t("personnel"), icon: Users },
        { id: "changeControl", label: t("changeControl"), icon: AlertTriangle },
        { id: "audit", label: t("audit"), icon: Clipboard },
        { id: "settings", label: t("settings"), icon: Settings },
        { id: "sops", label: "SOPs", icon: FileText },
        { id: "environmental", label: "Environment", icon: Thermometer },
      ],
    },
  ];

  // -------- LOGIN SCREEN --------
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-white font-bold text-4xl">N</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{t("welcome")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
            <p className="font-semibold mb-1">{t("loginInstructions")}</p>
            <p>{t("enterUsername")}</p>
            <p>{t("chooseRole")}</p>
          </div>
          <button
            onClick={handleLogin}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <LogIn className="w-5 h-5" />
            <span>{t("login")}</span>
          </button>
        </div>
      </div>
    );
  }

  // -------- MAIN APP --------
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } bg-gradient-to-b from-teal-900 to-teal-700 text-white transition-all duration-300 flex flex-col shadow-2xl`}
      >
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
            {sidebarCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
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
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? "bg-white text-teal-900 shadow-lg font-semibold"
                          : "hover:bg-teal-800 text-teal-100"
                      }`}
                      title={sidebarCollapsed ? item.label : ""}
                    >
                      <item.icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          isActive ? "text-teal-700" : ""
                        }`}
                      />
                      {!sidebarCollapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-teal-600">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center" : "space-x-3"
            }`}
          >
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {currentUser.name}
                </div>
                <div className="text-xs text-teal-200 truncate">
                  {currentUser.role}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
              title={t("logout")}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="glass-card text-center hover-lift">
              <div className="text-2xl font-bold text-teal-700">
                {batches.filter((b) => b.status === "in_progress").length}
              </div>
              <div className="text-xs text-gray-600">Active Batches</div>
            </div>
            <div className="glass-card text-center hover-lift">
              <div className="text-2xl font-bold text-yellow-700">
                {materials.filter((m) => m.status === "quarantine").length}
              </div>
              <div className="text-xs text-gray-600">In Quarantine</div>
            </div>
            <div className="glass-card text-center hover-lift">
              <div className="text-2xl font-bold text-blue-700">
                {capas.filter((c) => c.status !== "closed").length}
              </div>
              <div className="text-xs text-gray-600">Open CAPAs</div>
            </div>
            <div className="glass-card text-center hover-lift">
              <div className="text-2xl font-bold text-green-700">
                {
                  equipment.filter((e) => e.status === "operational").length
                }/{equipment.length}
              </div>
              <div className="text-xs text-gray-600">Equipment OK</div>
            </div>
          </div>

          {/* Active Tab Content */}
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
                addAuditEntry={addAuditEntry}
              />
            )}
            {activeTab === "formulas" && (
              <Formulas
                addAuditEntry={addAuditEntry}
                language={language}
                showESignature={showESignature}
                currentUser={currentUser}
              />
            )}
            
            {activeTab === "workflows" && (
              <EnhancedWorkflows
                workflows={workflows}
                setWorkflows={setWorkflows}
                formulas={formulas}
                equipment={equipment}
                workStations={workStations}
                addAuditEntry={addAuditEntry}
                language={language}
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
                setEquipment={setEquipment}
                selectedEquipmentClass={selectedEquipmentClass}
                equipmentClasses={equipmentClassesState}  // ← ВАЖНО! Должно быть equipmentClassesState
                setSelectedEquipmentClass={setSelectedEquipmentClass}
                addAuditEntry={addAuditEntry}
                language={language}
              />
            )}
            {activeTab === "equipmentConfig" && (
              <EquipmentConfigurator
                equipmentClasses={equipmentClassesState}
                setEquipmentClasses={setEquipmentClassesState}
                equipment={equipment}
                setEquipment={setEquipment}
                addAuditEntry={addAuditEntry}
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
            {/* 🆕 Новая вкладка Product Disposition */}
            {activeTab === "productDisposition" && (
              <ProductDisposition
                batches={batches}
                setBatches={setBatches}
                materials={materials}
                setMaterials={setMaterials}
                deviations={deviations}
                dispositions={dispositions}                // 🆕
                setDispositions={setDispositions}          // 🆕
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                language={language}
              />
            )}

            {/* 🆕 Новая вкладка Investigation Workflow */}
            {activeTab === "investigationWorkflow" && (
              <InvestigationWorkflow
                investigations={investigations}
                setInvestigations={setInvestigations}
                deviations={deviations}
                setDeviations={setDeviations}
                capas={capas}
                setCapas={setCapas}
                batches={batches}
                materials={materials}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
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
            {activeTab === "audit" && (
              <AuditTrail auditTrail={auditTrail} batches={batches} />
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
           {activeTab === "batchRelease" && (
              <BatchRelease
                batch={batches.find((b) => b.status === "completed")}
                workflows={workflows}
                formulas={formulas} // НОВЫЙ
                equipment={equipment} // НОВЫЙ
                workStations={workStations} // НОВЫЙ
                deviations={deviations}
                currentUser={currentUser}
                releaseBatch={releaseBatch}
                showESignature={showESignature}
                addAuditEntry={addAuditEntry}
                createStabilityStudy={createStabilityStudy} // НОВЫЙ
              />
            )}
            {activeTab === "yieldRecon" && (
              <YieldReconciliation
                batch={batches.find((b) => b.status === "completed")}
                formula={formulas.find(
                  (f) =>
                    f.id ===
                    batches.find((b) => b.status === "completed")?.formulaId
                )}
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
                createValidationProtocol={(data) => { // НОВЫЙ
                  console.log("Validation protocol created:", data);
                  addAuditEntry("Validation Protocol Created", data.id);
                }}
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
            {activeTab === "stabilityStudies" && (
              <StabilityStudies
                stabilityStudies={stabilityStudies}
                setStabilityStudies={setStabilityStudies}
                batches={batches}
                formulas={formulas}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
                language={language}
              />
            )}

            {activeTab === "trainingMatrix" && (
              <TrainingMatrix
                personnel={personnel}
                setPersonnel={setPersonnel}
                trainingRecords={trainingRecords}
                setTrainingRecords={setTrainingRecords}
                currentUser={currentUser}
                addAuditEntry={addAuditEntry}
                showESignature={showESignature}
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
              <DataIntegrityMonitor auditTrail={auditTrail} />
            )}
          </div>
        </div>
      </div>

      {/* E-Signature Modal — в самом конце */}
      {console.log("🔥 About to render ESignatureModal with:", eSignatureModal)}
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
