// Role Permissions
export const rolePermissions = {
  "Admin": {
    canCreateBatch: true,
    canStartBatch: true,
    canExecuteSteps: true,
    canApproveFormulas: true,
    canCreateFormulas: true,
    canCreateWorkflows: true,
    canApproveWorkflows: true,
    canManageMaterials: true,
    canValidateMaterials: true,
    canManageEquipment: true,
    canManageWorkStations: true,
    canManagePersonnel: true,
    canCreateUsers: true,
    canViewAudit: true,
    canExportReports: true,
    canManageRoles: true,
    canManageCAPAs: true,
    canViewGenealogy: true,
    allWorkStations: true
  },
  "Master": {
    canCreateBatch: false,
    canStartBatch: false,
    canExecuteSteps: true,
    canApproveFormulas: true,
    canCreateFormulas: true,
    canCreateWorkflows: true,
    canApproveWorkflows: true,
    canManageMaterials: false,
    canValidateMaterials: false,
    canManageEquipment: false,
    canManageWorkStations: false,
    canManagePersonnel: false,
    canCreateUsers: false,
    canViewAudit: true,
    canExportReports: true,
    canManageRoles: false,
    canManageCAPAs: false,
    canViewGenealogy: true,
    allWorkStations: true
  },
  "Planner": {
    canCreateBatch: true,
    canStartBatch: true,
    canExecuteSteps: false,
    canApproveFormulas: false,
    canCreateFormulas: false,
    canCreateWorkflows: false,
    canApproveWorkflows: false,
    canManageMaterials: false,
    canValidateMaterials: false,
    canManageEquipment: false,
    canManageWorkStations: false,
    canManagePersonnel: false,
    canCreateUsers: false,
    canViewAudit: true,
    canExportReports: true,
    canManageRoles: false,
    canManageCAPAs: false,
    canViewGenealogy: true,
    allWorkStations: false
  },
  "QA": {
    canCreateBatch: false,
    canStartBatch: false,
    canExecuteSteps: true,
    canApproveFormulas: true,
    canCreateFormulas: false,
    canCreateWorkflows: false,
    canApproveWorkflows: true,
    canManageMaterials: true,
    canValidateMaterials: true,
    canManageEquipment: false,
    canManageWorkStations: false,
    canManagePersonnel: false,
    canCreateUsers: false,
    canViewAudit: true,
    canExportReports: true,
    canManageRoles: false,
    canManageCAPAs: true,
    canViewGenealogy: true,
    allWorkStations: true
  },
  "Operator": {
    canCreateBatch: false,
    canStartBatch: false,
    canExecuteSteps: true,
    canApproveFormulas: false,
    canCreateFormulas: false,
    canCreateWorkflows: false,
    canApproveWorkflows: false,
    canManageMaterials: false,
    canValidateMaterials: false,
    canManageEquipment: false,
    canManageWorkStations: false,
    canManagePersonnel: false,
    canCreateUsers: false,
    canViewAudit: false,
    canExportReports: false,
    canManageRoles: false,
    canManageCAPAs: false,
    canViewGenealogy: false,
    allWorkStations: false
  }
};

export const initialFormulas = [
  {
    id: 1,
    articleNumber: "ART-001",
    productName: "Tablet A",
    weightPerUnit: 500,
    productType: "dosing",
    status: "approved",
    version: "1.0",
    bom: [
      { id: 1, materialArticle: "MAT-001", quantity: 250, unit: "mg", min: 245, max: 255, type: "raw_material" },
      { id: 2, materialArticle: "MAT-002", quantity: 200, unit: "mg", min: 195, max: 205, type: "raw_material" },
      { id: 3, materialArticle: "MAT-003", quantity: 50, unit: "mg", min: 48, max: 52, type: "raw_material" }
    ]
  }
];

export const initialMaterials = [
  {
    id: 1,
    articleNumber: "MAT-001",
    name: "API Powder Alpha",
    status: "validated",
    quantity: 50000,
    unit: "g",
    location: "Warehouse A-1",
    expiryDate: "2026-12-31",
    receivedDate: "2025-01-15",
    supplier: "Supplier A",
    lotNumber: "LOT-2025-001",
    coa: "COA-2025-001",
    quarantineTests: []
  },
  {
    id: 2,
    articleNumber: "MAT-002",
    name: "Excipient Beta",
    status: "quarantine",
    quantity: 25000,
    unit: "g",
    location: "Quarantine Zone",
    expiryDate: "2025-12-31",
    receivedDate: "2025-10-01",
    supplier: "Supplier B",
    lotNumber: "LOT-2025-002",
    coa: null,
    quarantineTests: [
      { test: "Identity", status: "pending", result: null },
      { test: "Purity", status: "pending", result: null },
      { test: "Moisture", status: "pending", result: null }
    ]
  },
  {
    id: 3,
    articleNumber: "MAT-003",
    name: "Lubricant Gamma",
    status: "validated",
    quantity: 10000,
    unit: "g",
    location: "Warehouse B-3",
    expiryDate: "2026-06-30",
    receivedDate: "2025-02-20",
    supplier: "Supplier C",
    lotNumber: "LOT-2025-003",
    coa: "COA-2025-003",
    quarantineTests: []
  }
];

export const equipmentClasses = {
  "Weighing": ["Precision Balance", "Analytical Balance", "Platform Scale"],
  "Mixing": ["Planetary Mixer", "High Shear Mixer", "V-Blender"],
  "Granulation": ["Wet Granulator", "Dry Granulator", "Fluid Bed"],
  "Coating": ["Pan Coater", "Fluid Bed Coater"],
  "Packaging": ["Blister Machine", "Bottle Filler", "Cartoner"]
};

export const initialEquipment = [
  {
    id: 1,
    name: "Balance-01",
    class: "Weighing",
    subclass: "Precision Balance",
    status: "operational",
    currentBatch: null,
    lastBatch: null,
    location: "Room 101",
    serialNumber: "BAL-2024-001",
    manufacturer: "Mettler Toledo",
    model: "XPE5003",
    installDate: "2024-01-15",
    calibrationDue: "2025-11-01",
    lastMaintenance: "2025-09-15",
    maintenanceInterval: 90,
    globalParameters: { 
      maxCapacity: 5000, 
      precision: 0.01,
      unit: "g"
    }
  },
  {
    id: 2,
    name: "Mixer-01",
    class: "Mixing",
    subclass: "Planetary Mixer",
    status: "operational",
    currentBatch: null,
    lastBatch: null,
    location: "Room 102",
    serialNumber: "MIX-2024-001",
    manufacturer: "Pharma Mix Inc",
    model: "PM-500",
    installDate: "2024-02-20",
    calibrationDue: "2025-12-01",
    lastMaintenance: "2025-08-20",
    maintenanceInterval: 180,
    globalParameters: { 
      volume: 50, 
      rpmRange: [10, 200],
      temperature: [15, 25],
      unit: "L"
    }
  },
  {
    id: 3,
    name: "Granulator-01",
    class: "Granulation",
    subclass: "Wet Granulator",
    status: "maintenance",
    currentBatch: null,
    lastBatch: "B-2025-099",
    location: "Room 103",
    serialNumber: "GRAN-2023-001",
    manufacturer: "GranTech",
    model: "WT-100",
    installDate: "2023-11-10",
    calibrationDue: "2025-10-15",
    lastMaintenance: "2025-10-01",
    maintenanceInterval: 120,
    globalParameters: {
      capacity: 100,
      rpmRange: [50, 300],
      unit: "kg"
    }
  }
];

export const initialWorkStations = [
  { 
    id: 1, 
    name: "Dispensing Station 1", 
    processes: ["dispensing", "weighing"], 
    equipmentIds: [1],
    location: "Room 101"
  },
  { 
    id: 2, 
    name: "Mixing Station 1", 
    processes: ["mixing"], 
    equipmentIds: [2],
    location: "Room 102"
  },
  {
    id: 3,
    name: "Granulation Station 1",
    processes: ["granulation"],
    equipmentIds: [3],
    location: "Room 103"
  }
];

export const initialWorkflows = [
  {
    id: 1,
    name: "Standard Tablet Production",
    formulaId: 1,
    version: "1.0",
    status: "approved",
    createdDate: "2025-09-01",
    steps: [
      {
        id: 1,
        name: "Dispense API",
        type: "dispensing",
        formulaBomId: 1,
        equipmentId: 1,
        workStationId: 1,
        requiresQC: false,
        instruction: "Dispense API according to formula",
        stepParameters: { targetWeight: 250, tolerance: 2, unit: "mg" }
      },
      {
        id: 2,
        name: "Dispense Excipient",
        type: "dispensing",
        formulaBomId: 2,
        equipmentId: 1,
        workStationId: 1,
        requiresQC: false,
        instruction: "Dispense Excipient according to formula",
        stepParameters: { targetWeight: 200, tolerance: 2, unit: "mg" }
      },
      {
        id: 3,
        name: "QC - Weight Check",
        type: "qc",
        equipmentId: 1,
        workStationId: 1,
        requiresQC: true,
        instruction: "Verify total weight of dispensed materials",
        qcParameters: { parameter: "Total Weight", min: 445, max: 455, unit: "mg" }
      },
      {
        id: 4,
        name: "Mixing",
        type: "process",
        equipmentId: 2,
        workStationId: 2,
        requiresQC: false,
        instruction: "Mix for 30 minutes at specified RPM",
        stepParameters: { duration: 30, rpm: 60, temperature: 20 }
      },
      {
        id: 5,
        name: "QC - Homogeneity Test",
        type: "qc",
        equipmentId: null,
        workStationId: 2,
        requiresQC: true,
        instruction: "Test mixture homogeneity",
        qcParameters: { parameter: "Homogeneity", min: 95, max: 100, unit: "%" }
      }
    ]
  }
];

export const initialPersonnel = [
  {
    id: 0,
    name: "System Admin",
    role: "Admin",
    department: "IT",
    status: "active",
    certifications: ["System Administrator", "GMP Advanced"],
    allowedWorkStations: [1, 2, 3],
    shifts: []
  },
  {
    id: 1,
    name: "John Operator",
    role: "Operator",
    department: "Production",
    status: "active",
    certifications: ["GMP Basic", "Weighing Operations"],
    allowedWorkStations: [1, 2],
    shifts: []
  },
  {
    id: 2,
    name: "Anna QA",
    role: "QA",
    department: "Quality",
    status: "active",
    certifications: ["GMP Advanced", "QC Methods"],
    allowedWorkStations: [1, 2, 3],
    shifts: []
  }
];

export const initialBatches = [
  {
    id: "B-2025-001",
    formulaId: 1,
    workflowId: 1,
    targetQuantity: 1000,
    status: "ready",
    priority: "normal",  // Добавить это поле!
    progress: 0,
    currentStep: null,
    currentStepIndex: 0,
    history: [],
    materialConsumption: [],
    createdDate: "2025-10-03",
    createdBy: "System",
    createdAt: "2025-10-03T08:00:00Z",
    startedAt: null,
    completedAt: null,
    startedBy: null
  },
  // Можно добавить еще тестовые батчи:
  {
    id: "B-2025-002",
    formulaId: 1,
    workflowId: 1,
    targetQuantity: 500,
    status: "in_progress",
    priority: "high",
    progress: 60,
    currentStep: 3,
    currentStepIndex: 2,
    history: [
      {
        stepId: 1,
        stepName: "Dispense API",
        value: "250.5",
        lotNumber: "LOT-2025-001",
        completedBy: "John Operator",
        timestamp: "2025-10-03T09:00:00Z",
        workStation: "Dispensing Station 1"
      },
      {
        stepId: 2,
        stepName: "Dispense Excipient",
        value: "200.2",
        lotNumber: "LOT-2025-002",
        completedBy: "John Operator",
        timestamp: "2025-10-03T09:15:00Z",
        workStation: "Dispensing Station 1"
      }
    ],
    materialConsumption: [
      {
        stepId: 1,
        materialArticle: "MAT-001",
        quantity: 125.25,
        unit: "g",
        lotNumber: "LOT-2025-001",
        timestamp: "2025-10-03T09:00:00Z"
      }
    ],
    createdDate: "2025-10-02",
    createdBy: "System",
    createdAt: "2025-10-02T14:00:00Z",
    startedAt: "2025-10-03T08:30:00Z",
    completedAt: null,
    startedBy: "John Operator"
  }
];

export const initialShifts = [
  {
    id: 1,
    date: "2025-10-03",
    shiftType: "Day Shift",
    startTime: "08:00",
    endTime: "16:00",
    assignedPersonnel: [1],
    workStationId: 1
  },
  {
    id: 2,
    date: "2025-10-03",
    shiftType: "Day Shift",
    startTime: "08:00",
    endTime: "16:00",
    assignedPersonnel: [2],
    workStationId: 2
  }
];

// New data for GMP features
export const initialCleaningRecords = [];
export const initialChangeControls = [];
export const initialCAPAs = [];
export const initialEquipmentLogs = [];
// Add new data exports
export const initialDeviations = [];
export const initialComplaints = [];
// Add to existing exports
export const initialSOPs = [];
export const initialEnvRecords = [];