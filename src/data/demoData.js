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
      { id: 1, materialArticle: "MAT-001", quantity: 250, unit: "mg" },
      { id: 2, materialArticle: "MAT-002", quantity: 200, unit: "mg" },
      { id: 3, materialArticle: "MAT-003", quantity: 50, unit: "mg" }
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
    lotNumber: "LOT-2025-001"
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
    lotNumber: "LOT-2025-002"
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
    lotNumber: "LOT-2025-003"
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
    globalParameters: { 
      maxCapacity: 5000, 
      precision: 0.01,
      unit: "g",
      calibrationDue: "2025-11-01"
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
        stepParameters: {
          targetWeight: 250,
          tolerance: 2,
          unit: "mg"
        }
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
        stepParameters: {
          targetWeight: 200,
          tolerance: 2,
          unit: "mg"
        }
      },
      {
        id: 3,
        name: "QC - Weight Check",
        type: "qc",
        equipmentId: 1,
        workStationId: 1,
        requiresQC: true,
        instruction: "Verify total weight of dispensed materials",
        qcParameters: {
          parameter: "Total Weight",
          min: 445,
          max: 455,
          unit: "mg"
        }
      },
      {
        id: 4,
        name: "Mixing",
        type: "process",
        equipmentId: 2,
        workStationId: 2,
        requiresQC: false,
        instruction: "Mix for 30 minutes at specified RPM",
        stepParameters: {
          duration: 30,
          rpm: 60,
          temperature: 20
        }
      },
      {
        id: 5,
        name: "QC - Homogeneity Test",
        type: "qc",
        equipmentId: null,
        workStationId: 2,
        requiresQC: true,
        instruction: "Test mixture homogeneity",
        qcParameters: {
          parameter: "Homogeneity",
          min: 95,
          max: 100,
          unit: "%"
        }
      }
    ]
  }
];

export const initialPersonnel = [
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
    progress: 0,
    currentStep: null,
    currentStepIndex: 0,
    history: [],
    materialConsumption: [],
    createdDate: "2025-10-03",
    createdBy: "System"
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