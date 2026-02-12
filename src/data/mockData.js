

export const schools = [
  { id: "sdo", name: "Schools Division Office of City of Baliuag", level: "SDO", lastUpdated: "2024-01-28", completenessScore: 98 },
  { id: "bncs", name: "Baliwag North Central School", level: "Elementary", lastUpdated: "2024-01-27", completenessScore: 95 },
  { id: "ces", name: "Catulinan Elementary School", level: "Elementary", lastUpdated: "2024-01-25", completenessScore: 88 },
  { id: "dgdmms", name: "Dr. Guillermo Dela Merced Memorial School", level: "Elementary", lastUpdated: "2024-01-26", completenessScore: 92 },
  { id: "dnvrms", name: "Dr. Natividad V. Rustia Memorial School", level: "Elementary", lastUpdated: "2024-01-24", completenessScore: 85 },
  { id: "evrcms", name: "Engr. Vicente R. Cruz Memorial School", level: "Elementary", lastUpdated: "2024-01-23", completenessScore: 78 },
  { id: "hes", name: "Hinukay Elementary School", level: "Elementary", lastUpdated: "2024-01-28", completenessScore: 91 },
  { id: "jpes", name: "Jacinto Ponce Elementary School", level: "Elementary", lastUpdated: "2024-01-22", completenessScore: 82 },
  { id: "jyims", name: "Josefa Y. Ycasiano Memorial School", level: "Elementary", lastUpdated: "2024-01-27", completenessScore: 89 },
  { id: "paes", name: "Paitan Elementary School", level: "Elementary", lastUpdated: "2024-01-21", completenessScore: 75 },
  { id: "saes", name: "Sabang Elementary School", level: "Elementary", lastUpdated: "2024-01-26", completenessScore: 93 },
  { id: "sues", name: "Subic Elementary School", level: "Elementary", lastUpdated: "2024-01-25", completenessScore: 87 },
  { id: "ties", name: "Tilapayong Elementary School", level: "Elementary", lastUpdated: "2024-01-24", completenessScore: 80 },
  { id: "bscs", name: "Baliwag South Central School", level: "Elementary", lastUpdated: "2024-01-28", completenessScore: 96 },
  { id: "cales", name: "Calantipay Elementary School", level: "Elementary", lastUpdated: "2024-01-23", completenessScore: 84 },
  { id: "cones", name: "Concepcion Elementary School", level: "Elementary", lastUpdated: "2024-01-22", completenessScore: 79 },
  { id: "mkes", name: "Makinabang Elementary School", level: "Elementary", lastUpdated: "2024-01-27", completenessScore: 90 },
  { id: "mtes", name: "Matangtubig Elementary School", level: "Elementary", lastUpdated: "2024-01-26", completenessScore: 86 },
  { id: "pbes", name: "Pinagbarilan Elementary School", level: "Elementary", lastUpdated: "2024-01-25", completenessScore: 83 },
  { id: "sjes", name: "San Jose Elementary School", level: "Elementary", lastUpdated: "2024-01-24", completenessScore: 77 },
  { id: "sbes", name: "Sta. Barbara Elementary School", level: "Elementary", lastUpdated: "2024-01-28", completenessScore: 94 },
  { id: "tares", name: "Tarcan Elementary School", level: "Elementary", lastUpdated: "2024-01-23", completenessScore: 81 },
  { id: "tiaes", name: "Tiaong Elementary School", level: "Elementary", lastUpdated: "2024-01-22", completenessScore: 76 },
  { id: "vdfes", name: "Virgen de las Flores Elementary School", level: "Elementary", lastUpdated: "2024-01-27", completenessScore: 88 },
  { id: "temhs", name: "Teodoro Evangelista Memorial High School", level: "Secondary", lastUpdated: "2024-01-28", completenessScore: 97 },
  { id: "sbhs", name: "Sta. Barbara High School", level: "Secondary", lastUpdated: "2024-01-26", completenessScore: 91 },
  { id: "bshs", name: "Baliwag Senior High School", level: "Senior High", lastUpdated: "2024-01-28", completenessScore: 99 },
];

export const users = [
  { uid: "admin1", email: "admin@deped-baliuag.gov.ph", displayName: "SDO Administrator", role: "sdo_admin", schoolId: null },
  { uid: "bncs1", email: "bncs@deped-baliuag.gov.ph", displayName: "BNCS User", role: "school_user", schoolId: "bncs" },
  { uid: "ces1", email: "ces@deped-baliuag.gov.ph", displayName: "CES User", role: "school_user", schoolId: "ces" },
  { uid: "bscs1", email: "bscs@deped-baliuag.gov.ph", displayName: "BSCS User", role: "school_user", schoolId: "bscs" },
  { uid: "temhs1", email: "temhs@deped-baliuag.gov.ph", displayName: "TEMHS User", role: "school_user", schoolId: "temhs" },
  { uid: "bshs1", email: "bshs@deped-baliuag.gov.ph", displayName: "BSHS User", role: "school_user", schoolId: "bshs" },
];

export const categories = [
  "Office Supplies",
  "ICT Equipment",
  "Medical Supplies",
  "Cleaning Materials",
  "Personal Protective Equipment",
  "Electrical Equipment",
  "Furniture & Fixtures",
  "Sports Equipment",
  "Other Supplies",
];

export const items = [
  { id: "item001", code: "OS-001", name: "Bondpaper, A4, Ream", category: "Office Supplies", unit: "Ream", type: "Consumable", reorderLevel: 10, isActive: true },
  { id: "item002", code: "OS-002", name: "Bondpaper, Legal, Ream", category: "Office Supplies", unit: "Ream", type: "Consumable", reorderLevel: 10, isActive: true },
  { id: "item003", code: "OS-003", name: "Ball Pen, Black, Pc", category: "Office Supplies", unit: "Piece", type: "Consumable", reorderLevel: 50, isActive: true },
  { id: "item004", code: "OS-004", name: "Sign Pen, Pilot G-Tech .5, Pc", category: "Office Supplies", unit: "Piece", type: "Consumable", reorderLevel: 20, isActive: true },
  { id: "item005", code: "OS-005", name: "Ink, Epson 003, Black Btl", category: "Office Supplies", unit: "Bottle", type: "Consumable", reorderLevel: 5, isActive: true },
  { id: "item006", code: "OS-006", name: "Ink, Epson 003, Set", category: "Office Supplies", unit: "Set", type: "Consumable", reorderLevel: 3, isActive: true },
  { id: "item007", code: "OS-007", name: "Folder, Legal, Pc", category: "Office Supplies", unit: "Piece", type: "Consumable", reorderLevel: 100, isActive: true },
  { id: "item008", code: "OS-008", name: "Stapler", category: "Office Supplies", unit: "Piece", type: "Semi-Expendable", reorderLevel: 2, isActive: true },
  { id: "item009", code: "OS-009", name: "Puncher, HD", category: "Office Supplies", unit: "Piece", type: "Semi-Expendable", reorderLevel: 2, isActive: true },
  { id: "item010", code: "OS-010", name: "Calculator", category: "Office Supplies", unit: "Piece", type: "Semi-Expendable", reorderLevel: 2, isActive: true },
  { id: "item011", code: "OS-011", name: "Flash Drive, 64GB", category: "Office Supplies", unit: "Piece", type: "Semi-Expendable", reorderLevel: 3, isActive: true },
  { id: "item012", code: "OS-012", name: "Correction Tape", category: "Office Supplies", unit: "Piece", type: "Consumable", reorderLevel: 20, isActive: true },
  { id: "item013", code: "ICT-001", name: "Printer, Epson L121", category: "ICT Equipment", unit: "Unit", type: "Semi-Expendable", reorderLevel: 1, isActive: true },
  { id: "item014", code: "ICT-002", name: "Printer, Epson L3210", category: "ICT Equipment", unit: "Unit", type: "Semi-Expendable", reorderLevel: 1, isActive: true },
  { id: "item015", code: "ICT-003", name: "Monitor, 24 in", category: "ICT Equipment", unit: "Unit", type: "Semi-Expendable", reorderLevel: 1, isActive: true },
  { id: "item016", code: "ICT-004", name: "Wireless Keyboard with Mouse", category: "ICT Equipment", unit: "Set", type: "Semi-Expendable", reorderLevel: 2, isActive: true },
  { id: "item017", code: "ICT-005", name: "Laminating Machine", category: "ICT Equipment", unit: "Unit", type: "Semi-Expendable", reorderLevel: 1, isActive: true },
  { id: "item018", code: "MED-001", name: "Alcohol, 1 Gal", category: "Medical Supplies", unit: "Gallon", type: "Consumable", reorderLevel: 5, isActive: true },
  { id: "item019", code: "MED-002", name: "Facemask, Box", category: "Medical Supplies", unit: "Box", type: "Consumable", reorderLevel: 10, isActive: true },
  { id: "item020", code: "MED-003", name: "Band Aid, Pack", category: "Medical Supplies", unit: "Pack", type: "Consumable", reorderLevel: 5, isActive: true },
  { id: "item021", code: "CLN-001", name: "Bleach, Gallon", category: "Cleaning Materials", unit: "Gallon", type: "Consumable", reorderLevel: 5, isActive: true },
  { id: "item022", code: "CLN-002", name: "Dishwashing Liquid, 1.5L", category: "Cleaning Materials", unit: "Bottle", type: "Consumable", reorderLevel: 5, isActive: true },
  { id: "item023", code: "CLN-003", name: "Floor Mop", category: "Cleaning Materials", unit: "Piece", type: "Semi-Expendable", reorderLevel: 3, isActive: true },
  { id: "item024", code: "PPE-001", name: "Reflectorized Vest", category: "Personal Protective Equipment", unit: "Piece", type: "Semi-Expendable", reorderLevel: 5, isActive: true },
  { id: "item025", code: "PPE-002", name: "Fire Extinguisher", category: "Personal Protective Equipment", unit: "Unit", type: "Semi-Expendable", reorderLevel: 2, isActive: true },
  { id: "item026", code: "ELC-001", name: "Emergency Lights", category: "Electrical Equipment", unit: "Unit", type: "Semi-Expendable", reorderLevel: 2, isActive: true },
  { id: "item027", code: "ELC-002", name: "Wall Clock", category: "Electrical Equipment", unit: "Piece", type: "Semi-Expendable", reorderLevel: 2, isActive: true },
  { id: "item028", code: "FUR-001", name: "Office Chair", category: "Furniture & Fixtures", unit: "Piece", type: "Semi-Expendable", reorderLevel: 3, isActive: true },
  { id: "item029", code: "FUR-002", name: "Steel Cabinet, 4 Drawers", category: "Furniture & Fixtures", unit: "Unit", type: "Semi-Expendable", reorderLevel: 1, isActive: true },
  { id: "item030", code: "SPT-001", name: "Basketball, Size 6", category: "Sports Equipment", unit: "Piece", type: "Semi-Expendable", reorderLevel: 3, isActive: true },
];

const sources = [
  "Maintenance and Other Operating Expenses (MOOE)",
  "Local School Board (LSB)/Local Government Unit (LGU)",
  "Donation",
  "Others",
];

const defaultUnitPrices = {
  "Office Supplies": 50,
  "ICT Equipment": 5000,
  "Medical Supplies": 200,
  "Cleaning Materials": 150,
  "Personal Protective Equipment": 300,
  "Electrical Equipment": 800,
  "Furniture & Fixtures": 2000,
  "Sports Equipment": 400,
  "Other Supplies": 100,
};

export const generateInventory = (schoolId) => {
  const conditions = ["Good", "Good", "Good", "Damaged", "For Repair"];
  const today = new Date();

  return items.map((item) => {
    const daysAgo = Math.floor(Math.random() * 90) + 1;
    const dateAcquired = new Date(today);
    dateAcquired.setDate(dateAcquired.getDate() - daysAgo);
    const quantity = Math.floor(Math.random() * 50) + 1;
    const unitPrice = (defaultUnitPrices[item.category] || 100) * (0.8 + Math.random() * 0.4);
    const totalCost = Math.round(quantity * unitPrice);
    return {
      ...item,
      schoolId,
      quantity,
      unitPrice: Math.round(unitPrice * 100) / 100,
      totalCost,
      source: sources[Math.floor(Math.random() * sources.length)],
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      dateAcquired: dateAcquired.toISOString().split("T")[0],
      lastUpdated: new Date(
        Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
    };
  });
};

export const movements = [
  {
    id: "mov001",
    type: "Delivery",
    schoolId: "bncs",
    schoolName: "Baliwag North Central School",
    date: "2024-01-28",
    refNo: "DR-2024-001",
    items: [
      { itemId: "item001", itemName: "Bondpaper, A4, Ream", quantity: 50 },
      { itemId: "item003", itemName: "Ball Pen, Black, Pc", quantity: 200 },
    ],
    createdBy: "bncs1",
    createdAt: "2024-01-28T08:00:00Z",
  },
  {
    id: "mov002",
    type: "Issue",
    schoolId: "bncs",
    schoolName: "Baliwag North Central School",
    date: "2024-01-27",
    refNo: "RIS-2024-001",
    items: [{ itemId: "item001", itemName: "Bondpaper, A4, Ream", quantity: 5 }],
    reason: "Teacher request for classroom use",
    createdBy: "bncs1",
    createdAt: "2024-01-27T10:00:00Z",
  },
  {
    id: "mov003",
    type: "Transfer",
    schoolId: "bscs",
    schoolName: "Baliwag South Central School",
    targetSchoolId: "bncs",
    targetSchoolName: "Baliwag North Central School",
    status: "Pending - Receiving School",
    date: "2024-01-28",
    refNo: "TR-2024-001",
    items: [{ itemId: "item013", itemName: "Printer, Epson L121", quantity: 1 }],
    reason: "Excess printer from BSCS for BNCS needs",
    createdBy: "bscs1",
    createdAt: "2024-01-28T09:00:00Z",
  },
  {
    id: "mov004",
    type: "Transfer",
    schoolId: "temhs",
    schoolName: "Teodoro Evangelista Memorial High School",
    targetSchoolId: "sbhs",
    targetSchoolName: "Sta. Barbara High School",
    status: "Pending - SDO Approval",
    date: "2024-01-26",
    refNo: "TR-2024-002",
    items: [{ itemId: "item030", itemName: "Basketball, Size 6", quantity: 5 }],
    reason: "Sports equipment sharing for intramurals",
    createdBy: "temhs1",
    createdAt: "2024-01-26T14:00:00Z",
  },
  {
    id: "mov005",
    type: "Disposal",
    schoolId: "ces",
    schoolName: "Catulinan Elementary School",
    date: "2024-01-25",
    refNo: "DIS-2024-001",
    items: [{ itemId: "item008", itemName: "Stapler", quantity: 2 }],
    reason: "Beyond repair, for disposal per COA guidelines",
    createdBy: "ces1",
    createdAt: "2024-01-25T11:00:00Z",
  },
];

export const auditLogs = [
  {
    id: "log001",
    action: "Delivery Added",
    schoolId: "bncs",
    schoolName: "Baliwag North Central School",
    details: "Added delivery DR-2024-001: 50 Bondpaper A4, 200 Ball Pen Black",
    userId: "bncs1",
    userName: "BNCS User",
    timestamp: "2024-01-28T08:00:00Z",
  },
  {
    id: "log002",
    action: "Items Issued",
    schoolId: "bncs",
    schoolName: "Baliwag North Central School",
    details: "Issued RIS-2024-001: 5 Bondpaper A4 - Teacher request",
    before: { quantity: 55 },
    after: { quantity: 50 },
    userId: "bncs1",
    userName: "BNCS User",
    timestamp: "2024-01-27T10:00:00Z",
  },
  {
    id: "log003",
    action: "Transfer Requested",
    schoolId: "bscs",
    schoolName: "Baliwag South Central School",
    details: "Transfer TR-2024-001 to BNCS: 1 Printer Epson L121",
    userId: "bscs1",
    userName: "BSCS User",
    timestamp: "2024-01-28T09:00:00Z",
  },
  {
    id: "log004",
    action: "Transfer Received",
    schoolId: "sbhs",
    schoolName: "Sta. Barbara High School",
    details: "Accepted transfer TR-2024-002 from TEMHS: 5 Basketball Size 6",
    userId: "sbhs1",
    userName: "SBHS User",
    timestamp: "2024-01-26T15:00:00Z",
  },
  {
    id: "log005",
    action: "Items Disposed",
    schoolId: "ces",
    schoolName: "Catulinan Elementary School",
    details: "Disposed DIS-2024-001: 2 Stapler - Beyond repair",
    before: { quantity: 5 },
    after: { quantity: 3 },
    userId: "ces1",
    userName: "CES User",
    timestamp: "2024-01-25T11:00:00Z",
  },
];

export const surplusItems = [
  { itemId: "item001", itemName: "Bondpaper, A4, Ream", category: "Office Supplies", schoolId: "bscs", schoolName: "Baliwag South Central School", surplusQuantity: 25, condition: "Good", lastUpdated: "2024-01-28" },
  { itemId: "item013", itemName: "Printer, Epson L121", category: "ICT Equipment", schoolId: "bscs", schoolName: "Baliwag South Central School", surplusQuantity: 2, condition: "Good", lastUpdated: "2024-01-28" },
  { itemId: "item030", itemName: "Basketball, Size 6", category: "Sports Equipment", schoolId: "temhs", schoolName: "Teodoro Evangelista Memorial High School", surplusQuantity: 8, condition: "Good", lastUpdated: "2024-01-27" },
  { itemId: "item018", itemName: "Alcohol, 1 Gal", category: "Medical Supplies", schoolId: "sbes", schoolName: "Sta. Barbara Elementary School", surplusQuantity: 10, condition: "Good", lastUpdated: "2024-01-26" },
  { itemId: "item028", itemName: "Office Chair", category: "Furniture & Fixtures", schoolId: "bshs", schoolName: "Baliwag Senior High School", surplusQuantity: 5, condition: "Good", lastUpdated: "2024-01-25" },
];

// Barcode / QR decoded value → item id. Use this when physical barcodes don't match item codes (e.g. UPC/EAN numbers).
// Add entries as you register barcodes to items (e.g. "8901234567890" → "item001" for Bondpaper A4).
export const barcodeToItemId = {
  "640001": "item001",
  "640002": "item002",
  "640003": "item003",
  "640013": "item013",
  "640018": "item018",
  "640028": "item028",
  "640030": "item030",
};

// Raw / undistributed inventory — government-funded supplies at SDO warehouse, not yet distributed to schools
export const rawInventoryInitial = [
  { id: "raw001", itemId: "item001", code: "OS-001", name: "Bondpaper, A4, Ream", category: "Office Supplies", unit: "Ream", quantity: 120, unitPrice: 245.0, totalCost: 29400, dateReceived: "2024-01-15", source: "Maintenance and Other Operating Expenses (MOOE)" },
  { id: "raw002", itemId: "item003", code: "OS-003", name: "Ball Pen, Black, Pc", category: "Office Supplies", unit: "Piece", quantity: 500, unitPrice: 12.5, totalCost: 6250, dateReceived: "2024-01-18", source: "Maintenance and Other Operating Expenses (MOOE)" },
  { id: "raw003", itemId: "item013", code: "ICT-001", name: "Printer, Epson L121", category: "ICT Equipment", unit: "Unit", quantity: 5, unitPrice: 8995.0, totalCost: 44975, dateReceived: "2024-01-20", source: "Local School Board (LSB)/Local Government Unit (LGU)" },
  { id: "raw004", itemId: "item018", code: "MED-001", name: "Alcohol, 1 Gal", category: "Medical Supplies", unit: "Gallon", quantity: 30, unitPrice: 380.0, totalCost: 11400, dateReceived: "2024-01-22", source: "Donation" },
  { id: "raw005", itemId: "item028", code: "FUR-001", name: "Office Chair", category: "Furniture & Fixtures", unit: "Piece", quantity: 12, unitPrice: 2500.0, totalCost: 30000, dateReceived: "2024-01-25", source: "Others" },
];
