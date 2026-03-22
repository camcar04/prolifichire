import type {
  User, Organization, Farm, Field, FieldBoundary, FieldStats,
  FieldRequirement, FieldAccessInstruction, OperatorProfile, Equipment,
  Credential, RateCard, Job, Quote, FieldPacket, FieldPacketFile,
  DatasetAsset, Invoice, InvoiceLineItem, Payment, SplitRule, Payout,
  Dispute, Review, MessageThread, Message, AuditLog, Notification,
  PermissionGrant, ChangeOrder, JobException, ProofOfWork, JobEvent,
  JobInput,
} from "@/types/domain";

// ═══════════════════════════════════════════════════════
// USERS & ORGS
// ═══════════════════════════════════════════════════════

export const organizations: Organization[] = [
  { id: "org-1", name: "Westfield Farms LLC", type: "farm", address: "14200 County Road 12", city: "Fremont", state: "NE", zip: "68025", phone: "(402) 555-0147", createdAt: "2022-03-15T00:00:00Z" },
  { id: "org-2", name: "AgriPro Custom Services", type: "operator", address: "890 Industrial Pkwy", city: "Columbus", state: "NE", zip: "68601", phone: "(402) 555-0283", website: "https://agripro.example.com", createdAt: "2020-06-01T00:00:00Z" },
  { id: "org-3", name: "Heartland Custom Farming", type: "operator", address: "2100 Main St", city: "Schuyler", state: "NE", zip: "68661", phone: "(402) 555-0391", createdAt: "2019-01-10T00:00:00Z" },
  { id: "org-4", name: "Prairie Partners Cooperative", type: "operator", address: "500 Elevator Rd", city: "David City", state: "NE", zip: "68632", phone: "(402) 555-0475", createdAt: "2018-09-20T00:00:00Z" },
  { id: "org-5", name: "Kessler Land & Cattle", type: "farm", address: "7800 N Highway 15", city: "Wayne", state: "NE", zip: "68787", phone: "(402) 555-0512", createdAt: "2021-11-05T00:00:00Z" },
];

export const users: User[] = [
  { id: "usr-1", email: "robert.westfield@gmail.com", firstName: "Robert", lastName: "Westfield", role: "grower", organizationId: "org-1", phone: "(402) 555-0147", createdAt: "2022-03-15T00:00:00Z", lastLoginAt: "2026-03-22T08:14:00Z" },
  { id: "usr-2", email: "sarah.westfield@gmail.com", firstName: "Sarah", lastName: "Westfield", role: "farm_manager", organizationId: "org-1", phone: "(402) 555-0148", createdAt: "2022-03-15T00:00:00Z", lastLoginAt: "2026-03-21T14:30:00Z" },
  { id: "usr-3", email: "mike.brennan@agripro.com", firstName: "Mike", lastName: "Brennan", role: "operator", organizationId: "org-2", phone: "(402) 555-0283", createdAt: "2020-06-01T00:00:00Z", lastLoginAt: "2026-03-22T06:45:00Z" },
  { id: "usr-4", email: "carlos.mendez@heartland.com", firstName: "Carlos", lastName: "Mendez", role: "operator", organizationId: "org-3", phone: "(402) 555-0391", createdAt: "2019-01-10T00:00:00Z", lastLoginAt: "2026-03-20T10:00:00Z" },
  { id: "usr-5", email: "dale.novak@prairie.coop", firstName: "Dale", lastName: "Novak", role: "operator", organizationId: "org-4", phone: "(402) 555-0475", createdAt: "2018-09-20T00:00:00Z", lastLoginAt: "2026-03-19T16:20:00Z" },
  { id: "usr-6", email: "admin@prolifichire.com", firstName: "Rachel", lastName: "Torres", role: "admin", organizationId: "org-1", createdAt: "2022-01-01T00:00:00Z", lastLoginAt: "2026-03-22T09:00:00Z" },
  { id: "usr-7", email: "finance@prolifichire.com", firstName: "James", lastName: "Park", role: "finance", organizationId: "org-1", createdAt: "2022-01-01T00:00:00Z", lastLoginAt: "2026-03-22T07:30:00Z" },
  { id: "usr-8", email: "tom.kessler@kessler.com", firstName: "Tom", lastName: "Kessler", role: "grower", organizationId: "org-5", phone: "(402) 555-0512", createdAt: "2021-11-05T00:00:00Z", lastLoginAt: "2026-03-18T12:00:00Z" },
];

export const currentUser = users[0]; // Robert Westfield, grower

// ═══════════════════════════════════════════════════════
// FARMS & FIELDS
// ═══════════════════════════════════════════════════════

export const farms: Farm[] = [
  { id: "farm-1", name: "Westfield Home Farm", organizationId: "org-1", ownerId: "usr-1", tenantId: undefined, county: "Washington", state: "NE", totalAcres: 571.1, fieldCount: 5, createdAt: "2022-03-15T00:00:00Z" },
  { id: "farm-2", name: "Westfield South", organizationId: "org-1", ownerId: "usr-1", tenantId: "usr-8", county: "Dodge", state: "NE", totalAcres: 320.0, fieldCount: 2, createdAt: "2023-01-10T00:00:00Z" },
];

export const fields: Field[] = [
  {
    id: "fld-1", farmId: "farm-1", name: "North 80 — Section 14", county: "Washington", state: "NE",
    crop: "corn", cropYear: 2026, acreage: 78.4, status: "active",
    centroid: { lat: 41.4521, lng: -96.1487 },
    boundingBox: { north: 41.4567, south: 41.4475, east: -96.1421, west: -96.1553 },
    currentJobId: "job-1", currentOperatorId: "usr-3",
    cluNumber: "NE181-14-001", fsa_farm_number: "4521",
    createdAt: "2022-03-15T00:00:00Z", updatedAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "fld-2", farmId: "farm-1", name: "River Bottom — East", county: "Washington", state: "NE",
    crop: "soybeans", cropYear: 2026, acreage: 124.2, status: "idle",
    centroid: { lat: 41.4389, lng: -96.1623 },
    boundingBox: { north: 41.4430, south: 41.4348, east: -96.1551, west: -96.1695 },
    createdAt: "2022-03-15T00:00:00Z", updatedAt: "2026-01-05T00:00:00Z",
  },
  {
    id: "fld-3", farmId: "farm-1", name: "Hilltop Quarter", county: "Washington", state: "NE",
    crop: "corn", cropYear: 2026, acreage: 156.8, status: "active",
    centroid: { lat: 41.4612, lng: -96.1312 },
    boundingBox: { north: 41.4680, south: 41.4544, east: -96.1225, west: -96.1399 },
    currentJobId: "job-3",
    createdAt: "2022-03-15T00:00:00Z", updatedAt: "2026-03-08T00:00:00Z",
  },
  {
    id: "fld-4", farmId: "farm-1", name: "County Line Strip", county: "Washington", state: "NE",
    crop: "wheat", cropYear: 2026, acreage: 42.1, status: "idle",
    centroid: { lat: 41.4445, lng: -96.1789 },
    boundingBox: { north: 41.4470, south: 41.4420, east: -96.1730, west: -96.1848 },
    createdAt: "2022-04-01T00:00:00Z", updatedAt: "2025-11-15T00:00:00Z",
  },
  {
    id: "fld-5", farmId: "farm-1", name: "West Bottoms", county: "Washington", state: "NE",
    crop: "soybeans", cropYear: 2026, acreage: 89.6, status: "idle",
    centroid: { lat: 41.4298, lng: -96.1890 },
    boundingBox: { north: 41.4345, south: 41.4251, east: -96.1820, west: -96.1960 },
    createdAt: "2022-05-10T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z",
  },
  {
    id: "fld-6", farmId: "farm-2", name: "Dodge South 160", county: "Dodge", state: "NE",
    crop: "corn", cropYear: 2026, acreage: 158.3, status: "pending",
    centroid: { lat: 41.3890, lng: -96.6512 },
    boundingBox: { north: 41.3960, south: 41.3820, east: -96.6420, west: -96.6604 },
    createdAt: "2023-01-10T00:00:00Z", updatedAt: "2026-02-20T00:00:00Z",
  },
  {
    id: "fld-7", farmId: "farm-2", name: "Platte View", county: "Dodge", state: "NE",
    crop: "soybeans", cropYear: 2026, acreage: 161.7, status: "idle",
    centroid: { lat: 41.3756, lng: -96.6398 },
    boundingBox: { north: 41.3825, south: 41.3687, east: -96.6310, west: -96.6486 },
    createdAt: "2023-01-10T00:00:00Z", updatedAt: "2025-10-30T00:00:00Z",
  },
];

// ═══════════════════════════════════════════════════════
// FIELD DETAILS
// ═══════════════════════════════════════════════════════

export const fieldStats: Record<string, FieldStats> = {
  "fld-1": { fieldId: "fld-1", totalJobs: 12, totalSpend: 18420, totalPaid: 14684, totalOutstanding: 3736, operatorsUsed: 3, filesUploaded: 18, lastJobDate: "2026-03-12T00:00:00Z", lastOperator: "AgriPro Custom Services", avgCostPerAcre: 42.30, cropYears: [2023, 2024, 2025, 2026] },
  "fld-2": { fieldId: "fld-2", totalJobs: 8, totalSpend: 12860, totalPaid: 12860, totalOutstanding: 0, operatorsUsed: 2, filesUploaded: 11, lastJobDate: "2025-10-28T00:00:00Z", lastOperator: "Prairie Partners Cooperative", avgCostPerAcre: 38.75, cropYears: [2023, 2024, 2025, 2026] },
  "fld-3": { fieldId: "fld-3", totalJobs: 10, totalSpend: 22140, totalPaid: 18904, totalOutstanding: 3236, operatorsUsed: 3, filesUploaded: 15, lastJobDate: "2026-03-08T00:00:00Z", lastOperator: "Heartland Custom Farming", avgCostPerAcre: 45.10, cropYears: [2024, 2025, 2026] },
  "fld-4": { fieldId: "fld-4", totalJobs: 5, totalSpend: 4850, totalPaid: 4850, totalOutstanding: 0, operatorsUsed: 2, filesUploaded: 6, avgCostPerAcre: 34.20, cropYears: [2024, 2025, 2026] },
  "fld-5": { fieldId: "fld-5", totalJobs: 7, totalSpend: 9640, totalPaid: 8440, totalOutstanding: 1200, operatorsUsed: 2, filesUploaded: 9, lastJobDate: "2025-11-20T00:00:00Z", lastOperator: "Heartland Custom Farming", avgCostPerAcre: 36.90, cropYears: [2023, 2024, 2025, 2026] },
  "fld-6": { fieldId: "fld-6", totalJobs: 3, totalSpend: 8720, totalPaid: 8720, totalOutstanding: 0, operatorsUsed: 1, filesUploaded: 4, avgCostPerAcre: 40.50, cropYears: [2025, 2026] },
  "fld-7": { fieldId: "fld-7", totalJobs: 4, totalSpend: 7240, totalPaid: 7240, totalOutstanding: 0, operatorsUsed: 2, filesUploaded: 5, avgCostPerAcre: 37.80, cropYears: [2024, 2025, 2026] },
};

export const fieldRequirements: FieldRequirement[] = [
  { id: "req-1", fieldId: "fld-1", type: "buffer_zone", description: "150ft buffer from Elkhorn River on south boundary", severity: "critical", appliesTo: ["spraying"], createdAt: "2022-04-01T00:00:00Z", createdBy: "usr-1" },
  { id: "req-2", fieldId: "fld-1", type: "restricted_product", description: "No dicamba products — neighboring specialty crops", severity: "critical", appliesTo: ["spraying"], createdAt: "2023-06-15T00:00:00Z", createdBy: "usr-1" },
  { id: "req-3", fieldId: "fld-1", type: "speed_limit", description: "Max 12 mph on county road approach", severity: "warning", appliesTo: ["spraying", "planting", "harvest", "tillage", "hauling"], createdAt: "2022-04-01T00:00:00Z", createdBy: "usr-2" },
  { id: "req-4", fieldId: "fld-3", type: "equipment_requirement", description: "GPS autosteer required — terraced contours", severity: "warning", appliesTo: ["planting", "spraying"], createdAt: "2024-03-01T00:00:00Z", createdBy: "usr-1" },
  { id: "req-5", fieldId: "fld-6", type: "timing_restriction", description: "No field entry before 8 AM — tenant livestock adjacent", severity: "info", appliesTo: ["spraying", "planting", "harvest", "tillage"], createdAt: "2023-02-01T00:00:00Z", createdBy: "usr-8" },
];

export const fieldAccessInstructions: Record<string, FieldAccessInstruction> = {
  "fld-1": { id: "acc-1", fieldId: "fld-1", directions: "Turn north off County Road 12 onto the gravel lane. Go 0.4 mi, field entrance on the right (east). Wide gate, fits 60ft sprayers.", gateCode: "4521", contactName: "Robert Westfield", contactPhone: "(402) 555-0147", hazards: "Soft spots near SE corner after rain. Overhead power line crosses NW corner at 45ft.", notes: "Park rigs on the gravel pad by the bins. Water fill available from the yard hydrant 0.2 mi south.", updatedAt: "2026-01-15T00:00:00Z", updatedBy: "usr-1" },
  "fld-2": { id: "acc-2", fieldId: "fld-2", directions: "Access from Highway 30 service road, turn east at the bridge. Field is 0.2 mi on the left. No gate.", contactName: "Robert Westfield", contactPhone: "(402) 555-0147", hazards: "Low-lying area floods in heavy rain. Check conditions before entry.", updatedAt: "2025-09-01T00:00:00Z", updatedBy: "usr-1" },
  "fld-3": { id: "acc-3", fieldId: "fld-3", directions: "North of town on Highway 15, turn west on gravel road. Field is 1 mi on the south side. Enter through the gap in the fence row.", contactName: "Sarah Westfield", contactPhone: "(402) 555-0148", notes: "Cell service is spotty in this area. Download field packet maps before arrival.", updatedAt: "2025-11-20T00:00:00Z", updatedBy: "usr-2" },
};

// ═══════════════════════════════════════════════════════
// OPERATORS
// ═══════════════════════════════════════════════════════

export const operators: OperatorProfile[] = [
  { id: "op-1", userId: "usr-3", organizationId: "org-2", businessName: "AgriPro Custom Services", serviceTypes: ["spraying", "fertilizing", "scouting"], serviceRadius: 45, baseLat: 41.4297, baseLng: -96.6293, baseAddress: "Columbus, NE", yearsExperience: 14, rating: 4.8, reviewCount: 47, completedJobs: 312, isVerified: true, insuranceVerified: true, bio: "Full-service custom application with GPS-guided precision sprayers. Licensed commercial applicator with 14 years experience in NE row crops.", createdAt: "2020-06-01T00:00:00Z" },
  { id: "op-2", userId: "usr-4", organizationId: "org-3", businessName: "Heartland Custom Farming", serviceTypes: ["planting", "tillage", "harvest", "hauling"], serviceRadius: 60, baseLat: 41.4407, baseLng: -96.7889, baseAddress: "Schuyler, NE", yearsExperience: 22, rating: 4.6, reviewCount: 38, completedJobs: 468, isVerified: true, insuranceVerified: true, bio: "Third-generation custom farming operation. Full planting-to-harvest service with late-model equipment. ISO-compatible precision data.", createdAt: "2019-01-10T00:00:00Z" },
  { id: "op-3", userId: "usr-5", organizationId: "org-4", businessName: "Prairie Partners Cooperative", serviceTypes: ["harvest", "hauling", "soil_sampling", "fertilizing"], serviceRadius: 35, baseLat: 41.2571, baseLng: -97.1292, baseAddress: "David City, NE", yearsExperience: 30, rating: 4.7, reviewCount: 52, completedJobs: 587, isVerified: true, insuranceVerified: true, bio: "Cooperative-owned custom work division. Combines, grain carts, and semi fleet. Competitive rates for members and non-members.", createdAt: "2018-09-20T00:00:00Z" },
];

export const equipment: Equipment[] = [
  { id: "eq-1", operatorId: "op-1", type: "Sprayer", make: "John Deere", model: "R4045", year: 2023, width: 120, gpsEquipped: true, isoCompatible: true, status: "active" },
  { id: "eq-2", operatorId: "op-1", type: "Sprayer", make: "Case IH", model: "Patriot 4440", year: 2021, width: 100, gpsEquipped: true, isoCompatible: true, status: "active" },
  { id: "eq-3", operatorId: "op-2", type: "Planter", make: "John Deere", model: "DB60 36-Row", year: 2024, width: 60, gpsEquipped: true, isoCompatible: true, status: "active" },
  { id: "eq-4", operatorId: "op-2", type: "Combine", make: "Case IH", model: "9250 Axial-Flow", year: 2022, width: 40, capacity: "410 bu", gpsEquipped: true, isoCompatible: true, status: "active" },
  { id: "eq-5", operatorId: "op-2", type: "Tillage", make: "John Deere", model: "2730 Disk Ripper", year: 2020, width: 26, gpsEquipped: false, isoCompatible: false, status: "active" },
  { id: "eq-6", operatorId: "op-3", type: "Combine", make: "John Deere", model: "X9 1100", year: 2024, width: 45, capacity: "1100 bu/hr", gpsEquipped: true, isoCompatible: true, status: "active" },
  { id: "eq-7", operatorId: "op-3", type: "Grain Cart", make: "Brent", model: "V1100", year: 2023, capacity: "1100 bu", gpsEquipped: true, isoCompatible: false, status: "active" },
];

export const credentials: Credential[] = [
  { id: "cred-1", operatorId: "op-1", type: "insurance", name: "Commercial General Liability", issuer: "Farm Bureau Insurance", number: "CGL-4521-NE", issuedAt: "2025-04-01T00:00:00Z", expiresAt: "2026-04-01T00:00:00Z", isVerified: true, verifiedAt: "2025-04-05T00:00:00Z", verifiedBy: "usr-6", status: "expiring_soon" },
  { id: "cred-2", operatorId: "op-1", type: "license", name: "Commercial Pesticide Applicator", issuer: "Nebraska Dept of Agriculture", number: "NDA-PA-8834", issuedAt: "2024-01-15T00:00:00Z", expiresAt: "2027-01-15T00:00:00Z", isVerified: true, verifiedAt: "2024-01-20T00:00:00Z", verifiedBy: "usr-6", status: "active" },
  { id: "cred-3", operatorId: "op-1", type: "certification", name: "Drift Reduction Technology Certified", issuer: "EPA / AAPCO", number: "DRT-2024-1192", issuedAt: "2024-06-01T00:00:00Z", expiresAt: "2027-06-01T00:00:00Z", isVerified: true, verifiedAt: "2024-06-10T00:00:00Z", verifiedBy: "usr-6", status: "active" },
  { id: "cred-4", operatorId: "op-2", type: "insurance", name: "Commercial General Liability", issuer: "Nationwide Agribusiness", number: "NAG-7789-NE", issuedAt: "2025-06-01T00:00:00Z", expiresAt: "2026-06-01T00:00:00Z", isVerified: true, verifiedAt: "2025-06-05T00:00:00Z", verifiedBy: "usr-6", status: "active" },
  { id: "cred-5", operatorId: "op-3", type: "insurance", name: "Commercial Auto & Equipment", issuer: "Farm Bureau Insurance", number: "CAE-3301-NE", issuedAt: "2025-08-01T00:00:00Z", expiresAt: "2026-08-01T00:00:00Z", isVerified: true, verifiedAt: "2025-08-10T00:00:00Z", verifiedBy: "usr-6", status: "active" },
];

export const rateCards: RateCard[] = [
  { id: "rc-1", operatorId: "op-1", operationType: "spraying", pricingModel: "per_acre", baseRate: 40.00, minimumFee: 500, travelFeePerMile: 3.50, urgencySurchargePercent: 15, materialPassthrough: true, validFrom: "2026-01-01T00:00:00Z" },
  { id: "rc-2", operatorId: "op-2", operationType: "planting", pricingModel: "per_acre", baseRate: 35.00, minimumFee: 750, travelFeePerMile: 4.00, materialPassthrough: false, validFrom: "2026-01-01T00:00:00Z" },
  { id: "rc-3", operatorId: "op-2", operationType: "harvest", pricingModel: "per_acre", baseRate: 48.00, minimumFee: 1000, travelFeePerMile: 5.00, materialPassthrough: false, validFrom: "2026-01-01T00:00:00Z" },
  { id: "rc-4", operatorId: "op-2", operationType: "tillage", pricingModel: "per_acre", baseRate: 28.00, minimumFee: 400, travelFeePerMile: 3.00, materialPassthrough: false, validFrom: "2026-01-01T00:00:00Z" },
  { id: "rc-5", operatorId: "op-3", operationType: "harvest", pricingModel: "per_acre", baseRate: 45.00, minimumFee: 800, travelFeePerMile: 4.50, materialPassthrough: false, validFrom: "2026-01-01T00:00:00Z" },
];

// ═══════════════════════════════════════════════════════
// JOBS
// ═══════════════════════════════════════════════════════

export const jobs: Job[] = [
  {
    id: "job-1", displayId: "JOB-1847", farmId: "farm-1", requestedBy: "usr-1",
    operationType: "spraying", status: "in_progress", urgency: "urgent",
    title: "Spring Herbicide Application — Pre-emerge",
    description: "Apply pre-emergence herbicide mix. Dual II Magnum + Atrazine per Rx map rates.",
    notes: "Watch wind speed — neighboring specialty crop field to the east. 150ft buffer on south boundary per requirement.",
    fields: [{ id: "jf-1", jobId: "job-1", fieldId: "fld-1", fieldName: "North 80 — Section 14", acreage: 78.4, crop: "corn", sequence: 1, status: "in_progress" }],
    operatorId: "usr-3", operatorName: "AgriPro Custom Services",
    pricingModel: "per_acre", baseRate: 40.00, totalAcres: 78.4,
    estimatedTotal: 3136, approvedTotal: 3136, invoicedTotal: 3136,
    scheduledStart: "2026-03-12T07:00:00Z", scheduledEnd: "2026-03-14T18:00:00Z",
    actualStart: "2026-03-12T08:15:00Z", deadline: "2026-03-18T00:00:00Z",
    travelDistance: 14.2, travelEta: 22,
    splitPayment: false, packetId: "pkt-1", packetStatus: "downloaded",
    proofSubmitted: false, proofApproved: false, changeOrderCount: 0, exceptionCount: 1,
    createdAt: "2026-03-05T14:30:00Z", updatedAt: "2026-03-12T08:15:00Z",
  },
  {
    id: "job-2", displayId: "JOB-1846", farmId: "farm-1", requestedBy: "usr-1",
    operationType: "planting", status: "completed", urgency: "normal",
    title: "Corn Planting — 35K population",
    fields: [{ id: "jf-2", jobId: "job-2", fieldId: "fld-2", fieldName: "River Bottom — East", acreage: 124.2, crop: "corn", sequence: 1, status: "completed" }],
    operatorId: "usr-4", operatorName: "Heartland Custom Farming",
    pricingModel: "per_acre", baseRate: 35.00, totalAcres: 124.2,
    estimatedTotal: 4347, approvedTotal: 4347,
    scheduledStart: "2026-03-01T06:00:00Z", scheduledEnd: "2026-03-03T18:00:00Z",
    actualStart: "2026-03-01T07:30:00Z", actualEnd: "2026-03-02T16:45:00Z",
    deadline: "2026-03-10T00:00:00Z", travelDistance: 28.1, travelEta: 38,
    splitPayment: false, packetId: "pkt-2", packetStatus: "downloaded",
    proofSubmitted: true, proofApproved: true, changeOrderCount: 0, exceptionCount: 0,
    createdAt: "2026-02-15T10:00:00Z", updatedAt: "2026-03-03T17:00:00Z",
  },
  {
    id: "job-3", displayId: "JOB-1845", farmId: "farm-1", requestedBy: "usr-1",
    operationType: "harvest", status: "scheduled", urgency: "normal",
    title: "Fall Corn Harvest",
    fields: [{ id: "jf-3", jobId: "job-3", fieldId: "fld-3", fieldName: "Hilltop Quarter", acreage: 156.8, crop: "corn", sequence: 1, status: "pending" }],
    operatorId: "usr-5", operatorName: "Prairie Partners Cooperative",
    pricingModel: "per_acre", baseRate: 48.00, totalAcres: 156.8,
    estimatedTotal: 7526, scheduledStart: "2026-10-10T06:00:00Z", scheduledEnd: "2026-10-14T18:00:00Z",
    deadline: "2026-10-20T00:00:00Z", travelDistance: 22.5, travelEta: 30,
    splitPayment: true,
    splitRules: [
      { id: "sr-1", jobId: "job-3", payerId: "usr-1", payerName: "Robert Westfield", payerRole: "owner", percentage: 50, status: "pending" },
      { id: "sr-2", jobId: "job-3", payerId: "usr-8", payerName: "Tom Kessler", payerRole: "tenant", percentage: 50, status: "pending" },
    ],
    packetId: "pkt-3", packetStatus: "ready",
    proofSubmitted: false, proofApproved: false, changeOrderCount: 0, exceptionCount: 0,
    createdAt: "2026-02-20T09:00:00Z", updatedAt: "2026-03-08T14:00:00Z",
  },
  {
    id: "job-4", displayId: "JOB-1844", farmId: "farm-1", requestedBy: "usr-2",
    operationType: "spraying", status: "approved", urgency: "normal",
    title: "Post-emerge Burndown — Soybeans",
    fields: [{ id: "jf-4", jobId: "job-4", fieldId: "fld-4", fieldName: "County Line Strip", acreage: 42.1, crop: "wheat", sequence: 1, status: "completed" }],
    operatorId: "usr-3", operatorName: "AgriPro Custom Services",
    pricingModel: "per_acre", baseRate: 38.00, totalAcres: 42.1,
    estimatedTotal: 1600, approvedTotal: 1600,
    scheduledStart: "2026-03-02T07:00:00Z", scheduledEnd: "2026-03-02T14:00:00Z",
    actualStart: "2026-03-02T08:00:00Z", actualEnd: "2026-03-02T12:30:00Z",
    deadline: "2026-03-08T00:00:00Z", travelDistance: 18.7, travelEta: 26,
    splitPayment: false, proofSubmitted: true, proofApproved: true,
    changeOrderCount: 0, exceptionCount: 0,
    createdAt: "2026-02-25T11:00:00Z", updatedAt: "2026-03-05T09:00:00Z",
  },
  {
    id: "job-5", displayId: "JOB-1843", farmId: "farm-1", requestedBy: "usr-1",
    operationType: "tillage", status: "paid", urgency: "normal",
    title: "Fall Chisel Plow",
    fields: [{ id: "jf-5", jobId: "job-5", fieldId: "fld-5", fieldName: "West Bottoms", acreage: 89.6, crop: "soybeans", sequence: 1, status: "completed" }],
    operatorId: "usr-4", operatorName: "Heartland Custom Farming",
    pricingModel: "per_acre", baseRate: 28.00, totalAcres: 89.6,
    estimatedTotal: 2509, approvedTotal: 2509, invoicedTotal: 2509, paidTotal: 2509,
    scheduledStart: "2025-11-15T07:00:00Z", scheduledEnd: "2025-11-16T17:00:00Z",
    actualStart: "2025-11-15T08:00:00Z", actualEnd: "2025-11-16T14:00:00Z",
    deadline: "2025-11-20T00:00:00Z", travelDistance: 31.4, travelEta: 42,
    splitPayment: false, proofSubmitted: true, proofApproved: true,
    changeOrderCount: 0, exceptionCount: 0,
    createdAt: "2025-11-01T10:00:00Z", updatedAt: "2025-12-01T09:00:00Z",
  },
  {
    id: "job-6", displayId: "JOB-1842", farmId: "farm-2", requestedBy: "usr-1",
    operationType: "spraying", status: "requested", urgency: "normal",
    title: "Pre-plant Burndown — Corn",
    fields: [{ id: "jf-6", jobId: "job-6", fieldId: "fld-6", fieldName: "Dodge South 160", acreage: 158.3, crop: "corn", sequence: 1, status: "pending" }],
    pricingModel: "per_acre", baseRate: 40.00, totalAcres: 158.3,
    estimatedTotal: 6332, deadline: "2026-04-15T00:00:00Z",
    splitPayment: true,
    splitRules: [
      { id: "sr-3", jobId: "job-6", payerId: "usr-1", payerName: "Robert Westfield", payerRole: "owner", percentage: 50, status: "pending" },
      { id: "sr-4", jobId: "job-6", payerId: "usr-8", payerName: "Tom Kessler", payerRole: "tenant", percentage: 50, status: "pending" },
    ],
    proofSubmitted: false, proofApproved: false, changeOrderCount: 0, exceptionCount: 0,
    createdAt: "2026-03-15T10:00:00Z", updatedAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "job-7", displayId: "JOB-1841", farmId: "farm-1", requestedBy: "usr-1",
    operationType: "soil_sampling", status: "quoted", urgency: "normal",
    title: "Grid Soil Sampling — 2.5 ac grids",
    fields: [
      { id: "jf-7", jobId: "job-7", fieldId: "fld-1", fieldName: "North 80 — Section 14", acreage: 78.4, crop: "corn", sequence: 1, status: "pending" },
      { id: "jf-8", jobId: "job-7", fieldId: "fld-3", fieldName: "Hilltop Quarter", acreage: 156.8, crop: "corn", sequence: 2, status: "pending" },
    ],
    pricingModel: "per_acre", baseRate: 12.00, totalAcres: 235.2,
    estimatedTotal: 2822, deadline: "2026-04-01T00:00:00Z",
    splitPayment: false, proofSubmitted: false, proofApproved: false,
    changeOrderCount: 0, exceptionCount: 0,
    createdAt: "2026-03-10T08:00:00Z", updatedAt: "2026-03-11T09:30:00Z",
  },
  {
    id: "job-8", displayId: "JOB-1840", farmId: "farm-1", requestedBy: "usr-2",
    operationType: "harvest", status: "invoiced", urgency: "normal",
    title: "Soybean Harvest",
    fields: [{ id: "jf-9", jobId: "job-8", fieldId: "fld-2", fieldName: "River Bottom — East", acreage: 124.2, crop: "soybeans", sequence: 1, status: "completed" }],
    operatorId: "usr-5", operatorName: "Prairie Partners Cooperative",
    pricingModel: "per_acre", baseRate: 45.00, totalAcres: 124.2,
    estimatedTotal: 5589, approvedTotal: 5589, invoicedTotal: 5589,
    scheduledStart: "2025-10-20T06:00:00Z", scheduledEnd: "2025-10-22T18:00:00Z",
    actualStart: "2025-10-20T07:00:00Z", actualEnd: "2025-10-21T16:00:00Z",
    deadline: "2025-10-28T00:00:00Z", travelDistance: 35.2, travelEta: 45,
    splitPayment: false, proofSubmitted: true, proofApproved: true,
    changeOrderCount: 0, exceptionCount: 0,
    createdAt: "2025-10-01T10:00:00Z", updatedAt: "2025-11-10T09:00:00Z",
  },
];

// ═══════════════════════════════════════════════════════
// JOB INPUTS / MATERIALS
// ═══════════════════════════════════════════════════════

export const jobInputs: JobInput[] = [
  {
    id: "ji-1", jobId: "job-1", productName: "Dual II Magnum", productType: "chemical",
    brand: "Syngenta", variant: "7.64 EC",
    quantity: 12, unit: "gallons",
    suppliedBy: "grower", pickupRequired: true,
    pickupLocationName: "Central Valley Co-op",
    pickupAddress: "1200 E Highway 30", pickupCity: "Fremont", pickupState: "NE", pickupZip: "68025",
    pickupLat: 41.4395, pickupLng: -96.4912,
    pickupContact: "Greg Tanner", pickupPhone: "(402) 555-0340",
    pickupInstructions: "Prepaid order under Westfield Farms. Ask for pesticide dock, back of building.",
    handlingNotes: "Keep sealed until ready to mix. Do not pre-mix more than 4 hours before application.",
    safetyNotes: "Restricted-use pesticide — certified applicator required",
    estimatedPickupDistance: 8.2, estimatedPickupTime: 14,
    sequence: 1,
  },
  {
    id: "ji-2", jobId: "job-1", productName: "Atrazine 4L", productType: "chemical",
    brand: "AATREX", variant: "4L liquid",
    quantity: 8, unit: "gallons",
    suppliedBy: "grower", pickupRequired: true,
    pickupLocationName: "Central Valley Co-op",
    pickupAddress: "1200 E Highway 30", pickupCity: "Fremont", pickupState: "NE", pickupZip: "68025",
    pickupLat: 41.4395, pickupLng: -96.4912,
    pickupContact: "Greg Tanner", pickupPhone: "(402) 555-0340",
    pickupInstructions: "Same order as Dual II Magnum — both on ticket #WF-4521.",
    safetyNotes: "Restricted-use pesticide — keep away from water sources",
    estimatedPickupDistance: 8.2, estimatedPickupTime: 0,
    sequence: 2,
  },
  {
    id: "ji-3", jobId: "job-1", productName: "Crop Oil Concentrate", productType: "adjuvant",
    brand: "Winfield", variant: "COC Plus",
    quantity: 4, unit: "gallons",
    suppliedBy: "operator", pickupRequired: false,
    sequence: 3,
  },
  {
    id: "ji-4", jobId: "job-2", productName: "DeKalb DKC62-53", productType: "seed",
    brand: "DeKalb (Bayer)", variant: "VT2P RIB — TreatSeed applied",
    quantity: 56, unit: "bags",
    suppliedBy: "grower", pickupRequired: true,
    pickupLocationName: "Bayer Seed Dealer — Dodge City Ag",
    pickupAddress: "3400 N Broad St", pickupCity: "Fremont", pickupState: "NE", pickupZip: "68025",
    pickupLat: 41.4550, pickupLng: -96.5010,
    pickupContact: "Mark Schultz", pickupPhone: "(402) 555-0488",
    pickupInstructions: "Seed staged on pallets near loading dock. Order #DC-2026-0891. Bring own forklift or call ahead.",
    handlingNotes: "Do not stack more than 3 pallets high. Keep dry — treated seed.",
    estimatedPickupDistance: 12.4, estimatedPickupTime: 18,
    sequence: 1,
  },
  {
    id: "ji-5", jobId: "job-2", productName: "10-34-0 Starter Fertilizer", productType: "fertilizer",
    brand: "Generic", variant: "Liquid in-furrow",
    quantity: 300, unit: "gallons",
    suppliedBy: "operator", pickupRequired: false,
    handlingNotes: "Operator mixes and supplies at standard rate of $0.45/gal pass-through.",
    sequence: 2,
  },
  {
    id: "ji-6", jobId: "job-6", productName: "Roundup PowerMax 3", productType: "chemical",
    brand: "Bayer", variant: "5.5 lb ae/gal",
    quantity: 24, unit: "gallons",
    suppliedBy: "grower", pickupRequired: true,
    pickupLocationName: "Farmer's Alliance Co-op",
    pickupAddress: "600 Railroad Ave", pickupCity: "North Bend", pickupState: "NE", pickupZip: "68649",
    pickupLat: 41.4620, pickupLng: -96.7810,
    pickupContact: "Jenny Sims", pickupPhone: "(402) 555-0622",
    pickupInstructions: "Order under Tom Kessler / Westfield South. Present farm ID.",
    estimatedPickupDistance: 15.8, estimatedPickupTime: 22,
    sequence: 1,
  },
  {
    id: "ji-7", jobId: "job-6", productName: "2,4-D LV6", productType: "chemical",
    brand: "Corteva", variant: "Low-volatile ester",
    quantity: 6, unit: "gallons",
    suppliedBy: "grower", pickupRequired: true,
    pickupLocationName: "Farmer's Alliance Co-op",
    pickupAddress: "600 Railroad Ave", pickupCity: "North Bend", pickupState: "NE", pickupZip: "68649",
    pickupLat: 41.4620, pickupLng: -96.7810,
    estimatedPickupDistance: 15.8, estimatedPickupTime: 0,
    sequence: 2,
  },
  {
    id: "ji-8", jobId: "job-6", productName: "NIS Surfactant", productType: "adjuvant",
    quantity: 2, unit: "gallons",
    suppliedBy: "operator", pickupRequired: false,
    sequence: 3,
  },
];

export function getInputsByJob(jobId: string): JobInput[] {
  return jobInputs.filter(i => i.jobId === jobId).sort((a, b) => a.sequence - b.sequence);
}

// ═══════════════════════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════════════════════

export const quotes: Quote[] = [
  { id: "qt-1", jobId: "job-7", operatorId: "op-3", operatorName: "Prairie Partners Cooperative", pricingModel: "per_acre", baseRate: 12.00, travelFee: 85, materialCost: 0, totalQuote: 2907, notes: "Can do 2.5-ac grids with GPS. Lab fees included.", validUntil: "2026-03-25T00:00:00Z", status: "pending", submittedAt: "2026-03-11T09:30:00Z" },
  { id: "qt-2", jobId: "job-7", operatorId: "op-1", operatorName: "AgriPro Custom Services", pricingModel: "per_acre", baseRate: 14.00, travelFee: 50, materialCost: 0, totalQuote: 3343, notes: "We pull our own cores — no subcontracting. Results in 5 business days.", validUntil: "2026-03-25T00:00:00Z", status: "pending", submittedAt: "2026-03-11T14:15:00Z" },
];

// ═══════════════════════════════════════════════════════
// DATASETS & FILES
// ═══════════════════════════════════════════════════════

export const datasets: DatasetAsset[] = [
  { id: "ds-1", fieldId: "fld-1", category: "boundary", format: "geojson", fileName: "north-80-boundary-v3.geojson", fileSize: 24576, mimeType: "application/geo+json", version: 3, cropYear: 2026, uploadedBy: "usr-1", uploadedByName: "Robert Westfield", isLatest: true, createdAt: "2026-01-15T10:00:00Z" },
  { id: "ds-2", fieldId: "fld-1", category: "prescription", format: "shapefile", fileName: "spring-rx-herbicide-2026.zip", fileSize: 1258291, mimeType: "application/zip", version: 1, cropYear: 2026, operationType: "spraying", uploadedBy: "usr-2", uploadedByName: "Sarah Westfield", description: "Pre-emerge Rx map — variable rate Dual II Magnum + Atrazine", isLatest: true, createdAt: "2026-03-01T08:00:00Z" },
  { id: "ds-3", fieldId: "fld-1", category: "soil_sample", format: "csv", fileName: "soil-sample-results-fall-2025.csv", fileSize: 49152, mimeType: "text/csv", version: 1, cropYear: 2025, operationType: "soil_sampling", operatorId: "op-3", operatorName: "Prairie Partners Cooperative", uploadedBy: "usr-5", uploadedByName: "Dale Novak", isLatest: true, createdAt: "2025-11-20T14:00:00Z" },
  { id: "ds-4", fieldId: "fld-1", category: "planting", format: "shapefile", fileName: "planting-plan-corn-2026.zip", fileSize: 389120, mimeType: "application/zip", version: 1, cropYear: 2026, operationType: "planting", uploadedBy: "usr-2", uploadedByName: "Sarah Westfield", description: "Corn planting plan — 35K variable rate pop", isLatest: true, createdAt: "2026-02-20T09:00:00Z" },
  { id: "ds-5", fieldId: "fld-1", category: "as_applied", format: "shapefile", fileName: "as-applied-spray-fall-2025.zip", fileSize: 892416, mimeType: "application/zip", version: 1, cropYear: 2025, operationType: "spraying", operatorId: "op-1", operatorName: "AgriPro Custom Services", uploadedBy: "usr-3", uploadedByName: "Mike Brennan", isLatest: true, createdAt: "2025-09-28T16:00:00Z" },
  { id: "ds-6", fieldId: "fld-1", category: "harvest", format: "shapefile", fileName: "yield-data-corn-2025.zip", fileSize: 2148576, mimeType: "application/zip", version: 1, cropYear: 2025, operationType: "harvest", operatorId: "op-3", operatorName: "Prairie Partners Cooperative", uploadedBy: "usr-5", uploadedByName: "Dale Novak", isLatest: true, createdAt: "2025-10-30T15:00:00Z" },
  { id: "ds-7", fieldId: "fld-1", category: "photo", format: "jpg", fileName: "field-condition-pre-spray-mar12.jpg", fileSize: 3145728, mimeType: "image/jpeg", version: 1, cropYear: 2026, operationType: "spraying", operatorId: "op-1", operatorName: "AgriPro Custom Services", uploadedBy: "usr-3", uploadedByName: "Mike Brennan", description: "Field condition photo — pre-application", isLatest: true, createdAt: "2026-03-12T08:30:00Z" },
  { id: "ds-8", fieldId: "fld-1", jobId: "job-1", category: "access_instructions", format: "pdf", fileName: "access-notes-north80.pdf", fileSize: 156672, mimeType: "application/pdf", version: 2, cropYear: 2026, uploadedBy: "usr-1", uploadedByName: "Robert Westfield", isLatest: true, createdAt: "2026-01-15T10:30:00Z" },
  // Other fields
  { id: "ds-9", fieldId: "fld-2", category: "boundary", format: "geojson", fileName: "river-bottom-boundary.geojson", fileSize: 32768, mimeType: "application/geo+json", version: 2, cropYear: 2026, uploadedBy: "usr-1", uploadedByName: "Robert Westfield", isLatest: true, createdAt: "2025-01-10T00:00:00Z" },
  { id: "ds-10", fieldId: "fld-3", category: "boundary", format: "geojson", fileName: "hilltop-boundary.geojson", fileSize: 28672, mimeType: "application/geo+json", version: 1, cropYear: 2026, uploadedBy: "usr-1", uploadedByName: "Robert Westfield", isLatest: true, createdAt: "2024-03-01T00:00:00Z" },
];

// ═══════════════════════════════════════════════════════
// FIELD PACKETS
// ═══════════════════════════════════════════════════════

export const fieldPackets: FieldPacket[] = [
  {
    id: "pkt-1", jobId: "job-1", fieldId: "fld-1", version: 2, status: "downloaded",
    operatorId: "usr-3",
    files: [
      { id: "pf-1", packetId: "pkt-1", datasetId: "ds-1", category: "boundary", fileName: "north-80-boundary-v3.geojson", fileSize: 24576, format: "geojson", version: 3, included: true, required: true },
      { id: "pf-2", packetId: "pkt-1", datasetId: "ds-2", category: "prescription", fileName: "spring-rx-herbicide-2026.zip", fileSize: 1258291, format: "shapefile", version: 1, included: true, required: true },
      { id: "pf-3", packetId: "pkt-1", datasetId: "ds-8", category: "access_instructions", fileName: "access-notes-north80.pdf", fileSize: 156672, format: "pdf", version: 2, included: true, required: true },
      { id: "pf-4", packetId: "pkt-1", datasetId: "ds-5", category: "as_applied", fileName: "as-applied-spray-fall-2025.zip", fileSize: 892416, format: "shapefile", version: 1, included: true, required: false },
    ],
    missingRequired: [],
    generatedAt: "2026-03-10T14:00:00Z", generatedBy: "system",
    approvedForExecution: true, approvedAt: "2026-03-10T14:30:00Z",
    downloadCount: 2, lastDownloadAt: "2026-03-12T06:30:00Z", lastDownloadBy: "usr-3",
  },
  {
    id: "pkt-3", jobId: "job-3", fieldId: "fld-3", version: 1, status: "ready",
    operatorId: "usr-5",
    files: [
      { id: "pf-5", packetId: "pkt-3", datasetId: "ds-10", category: "boundary", fileName: "hilltop-boundary.geojson", fileSize: 28672, format: "geojson", version: 1, included: true, required: true },
      { id: "pf-6", packetId: "pkt-3", datasetId: "", category: "planting", fileName: "", fileSize: 0, format: "other", version: 0, included: false, required: true },
    ],
    missingRequired: ["Planting data — needed for harvest reference"],
    generatedAt: "2026-03-08T14:00:00Z", generatedBy: "system",
    approvedForExecution: false, downloadCount: 0,
  },
];

// ═══════════════════════════════════════════════════════
// FINANCIAL
// ═══════════════════════════════════════════════════════

export const invoices: Invoice[] = [
  {
    id: "inv-1", displayId: "INV-3021", jobId: "job-1", fieldId: "fld-1",
    issuedTo: "usr-1", issuedToName: "Robert Westfield",
    issuedBy: "usr-3", issuedByName: "AgriPro Custom Services",
    lineItems: [
      { id: "li-1", description: "Pre-emerge herbicide application — 78.4 ac @ $40.00/ac", quantity: 78.4, unit: "acres", unitPrice: 40.00, total: 3136.00 },
    ],
    subtotal: 3136.00, fees: 94.08, tax: 0, total: 3230.08,
    status: "sent", dueDate: "2026-04-14T00:00:00Z",
    createdAt: "2026-03-14T10:00:00Z",
  },
  {
    id: "inv-2", displayId: "INV-2984", jobId: "job-8", fieldId: "fld-2",
    issuedTo: "usr-1", issuedToName: "Robert Westfield",
    issuedBy: "usr-5", issuedByName: "Prairie Partners Cooperative",
    lineItems: [
      { id: "li-2", description: "Soybean harvest — 124.2 ac @ $45.00/ac", quantity: 124.2, unit: "acres", unitPrice: 45.00, total: 5589.00 },
      { id: "li-3", description: "Travel charge — 35.2 mi @ $4.50/mi", quantity: 35.2, unit: "miles", unitPrice: 4.50, total: 158.40 },
    ],
    subtotal: 5747.40, fees: 172.42, tax: 0, total: 5919.82,
    status: "overdue", dueDate: "2025-12-10T00:00:00Z",
    createdAt: "2025-11-10T09:00:00Z",
  },
  {
    id: "inv-3", displayId: "INV-2901", jobId: "job-5", fieldId: "fld-5",
    issuedTo: "usr-1", issuedToName: "Robert Westfield",
    issuedBy: "usr-4", issuedByName: "Heartland Custom Farming",
    lineItems: [
      { id: "li-4", description: "Fall chisel plow — 89.6 ac @ $28.00/ac", quantity: 89.6, unit: "acres", unitPrice: 28.00, total: 2508.80 },
    ],
    subtotal: 2508.80, fees: 75.26, tax: 0, total: 2584.06,
    status: "paid", dueDate: "2025-12-15T00:00:00Z", paidAt: "2025-12-08T10:00:00Z",
    createdAt: "2025-11-20T09:00:00Z",
  },
];

export const payments: Payment[] = [
  { id: "pay-1", invoiceId: "inv-3", payerId: "usr-1", payerName: "Robert Westfield", amount: 2584.06, method: "ach", status: "completed", processedAt: "2025-12-08T10:00:00Z", createdAt: "2025-12-08T09:00:00Z" },
];

export const payouts: Payout[] = [
  { id: "po-1", operatorId: "op-2", operatorName: "Heartland Custom Farming", jobId: "job-5", invoiceId: "inv-3", grossAmount: 2508.80, platformFee: 62.72, processingFee: 12.54, netAmount: 2433.54, status: "completed", completedAt: "2025-12-10T10:00:00Z", createdAt: "2025-12-08T10:00:00Z" },
];

export const disputes: Dispute[] = [
  {
    id: "disp-1", displayId: "DSP-1001", jobId: "job-8", fieldId: "fld-2",
    raisedBy: "usr-1", raisedByName: "Robert Westfield",
    againstId: "usr-5", againstName: "Prairie Partners Cooperative",
    reason: "Acreage discrepancy",
    description: "Invoice shows 124.2 ac but GPS logs from combine show 118.7 ac were actually harvested. 5.5 ac strip on the east side was too wet and skipped. Requesting adjustment.",
    amountDisputed: 247.50, status: "under_review",
    createdAt: "2025-11-15T14:00:00Z",
  },
];

// ═══════════════════════════════════════════════════════
// EXCEPTIONS & CHANGE ORDERS
// ═══════════════════════════════════════════════════════

export const jobExceptions: JobException[] = [
  { id: "exc-1", jobId: "job-1", type: "weather_delay", description: "Rain forecast Mar 13 — 0.8\" expected. Spraying suspended after completing 45 of 78.4 acres. Resuming Mar 14 AM if conditions allow.", raisedBy: "usr-3", raisedByName: "Mike Brennan", status: "acknowledged", createdAt: "2026-03-12T16:30:00Z" },
];

export const changeOrders: ChangeOrder[] = [];

export const proofsOfWork: ProofOfWork[] = [
  { id: "pow-1", jobId: "job-2", fieldId: "fld-2", operatorId: "op-2", actualAcres: 124.2, completionNotes: "Planted at 35K variable rate per Rx. Clean passes, no replant needed. 2.4 mph average speed.", photoIds: ["ds-photo-1"], submittedAt: "2026-03-02T17:00:00Z", approvedAt: "2026-03-03T09:00:00Z", approvedBy: "usr-1", status: "approved" },
  { id: "pow-2", jobId: "job-4", fieldId: "fld-4", operatorId: "op-1", actualAcres: 42.1, completionNotes: "Post-emerge burndown complete. Applied Roundup PowerMax3 @ 32 oz/ac + AMS. Wind 4-6 mph SSE. Good coverage.", photoIds: [], submittedAt: "2026-03-02T13:00:00Z", approvedAt: "2026-03-03T08:00:00Z", approvedBy: "usr-2", status: "approved" },
  { id: "pow-3", jobId: "job-5", fieldId: "fld-5", operatorId: "op-2", actualAcres: 89.6, completionNotes: "Chisel plowed full field. 10\" depth. Ground was in good condition.", photoIds: [], submittedAt: "2025-11-16T14:30:00Z", approvedAt: "2025-11-17T08:00:00Z", approvedBy: "usr-1", status: "approved" },
];

// ═══════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════

export const messageThreads: MessageThread[] = [
  {
    id: "thr-1", jobId: "job-1", fieldId: "fld-1", subject: "Spring Spray — North 80 Timing",
    participants: [
      { userId: "usr-1", userName: "Robert Westfield", role: "grower" },
      { userId: "usr-3", userName: "Mike Brennan", role: "operator" },
    ],
    lastMessageAt: "2026-03-12T16:45:00Z",
    lastMessagePreview: "Rain coming in tonight. I got 45 of the 78 done. Will finish Thursday AM if it dries out.",
    unreadCount: 1, createdAt: "2026-03-08T14:00:00Z",
  },
  {
    id: "thr-2", jobId: "job-3", fieldId: "fld-3", subject: "Harvest Plan — Hilltop Quarter",
    participants: [
      { userId: "usr-1", userName: "Robert Westfield", role: "grower" },
      { userId: "usr-5", userName: "Dale Novak", role: "operator" },
      { userId: "usr-8", userName: "Tom Kessler", role: "grower" },
    ],
    lastMessageAt: "2026-03-07T10:00:00Z",
    lastMessagePreview: "Dale — we'll need the planting data uploaded before you generate the final packet. Sarah is working on it.",
    unreadCount: 0, createdAt: "2026-02-20T09:30:00Z",
  },
  {
    id: "thr-3", jobId: "job-8", fieldId: "fld-2", subject: "Acreage Discrepancy — Soybean Harvest",
    participants: [
      { userId: "usr-1", userName: "Robert Westfield", role: "grower" },
      { userId: "usr-5", userName: "Dale Novak", role: "operator" },
    ],
    lastMessageAt: "2025-11-16T09:00:00Z",
    lastMessagePreview: "Robert, I checked the combine logs. You're right, we skipped a wet strip on the east end. Let me adjust the invoice.",
    unreadCount: 0, createdAt: "2025-11-15T14:30:00Z",
  },
];

export const messages: Message[] = [
  { id: "msg-1", threadId: "thr-1", senderId: "usr-1", senderName: "Robert Westfield", senderRole: "grower", content: "Mike — spray window is opening up Wed/Thu. Can you get to the North 80 first thing Wednesday?", readBy: ["usr-1", "usr-3"], createdAt: "2026-03-08T14:00:00Z" },
  { id: "msg-2", threadId: "thr-1", senderId: "usr-3", senderName: "Mike Brennan", senderRole: "operator", content: "Should work. I'm finishing a job in Dodge County Tuesday PM. I'll head your way early Wednesday. Field packet downloaded — Rx map looks straightforward. One question: is the 150ft river buffer still in effect?", readBy: ["usr-1", "usr-3"], createdAt: "2026-03-08T15:30:00Z" },
  { id: "msg-3", threadId: "thr-1", senderId: "usr-1", senderName: "Robert Westfield", senderRole: "grower", content: "Yes — 150ft buffer on the south. And no dicamba — neighbor has specialty tomatoes on the east side this year. Both are flagged in the requirements.", readBy: ["usr-1", "usr-3"], createdAt: "2026-03-08T15:45:00Z" },
  { id: "msg-4", threadId: "thr-1", senderId: "usr-3", senderName: "Mike Brennan", senderRole: "operator", content: "Copy that. I'll use the R4045 with the 120ft booms and shut off the sections on the buffer. Should have you done by lunch.", readBy: ["usr-1", "usr-3"], createdAt: "2026-03-08T16:10:00Z" },
  { id: "msg-5", threadId: "thr-1", senderId: "usr-3", senderName: "Mike Brennan", senderRole: "operator", content: "Rain coming in tonight. I got 45 of the 78 done. Will finish Thursday AM if it dries out.", readBy: ["usr-3"], createdAt: "2026-03-12T16:45:00Z" },
];

// ═══════════════════════════════════════════════════════
// AUDIT & PERMISSIONS
// ═══════════════════════════════════════════════════════

export const auditLogs: AuditLog[] = [
  { id: "al-1", action: "job_started", entityType: "job", entityId: "job-1", userId: "usr-3", userName: "Mike Brennan", description: "Started spray job JOB-1847 on North 80 — Section 14", createdAt: "2026-03-12T08:15:00Z" },
  { id: "al-2", action: "exception_raised", entityType: "job", entityId: "job-1", userId: "usr-3", userName: "Mike Brennan", description: "Weather delay — rain forecast, 45 of 78.4 ac completed", createdAt: "2026-03-12T16:30:00Z" },
  { id: "al-3", action: "packet_downloaded", entityType: "packet", entityId: "pkt-1", userId: "usr-3", userName: "Mike Brennan", description: "Downloaded field packet v2 for JOB-1847", createdAt: "2026-03-12T06:30:00Z" },
  { id: "al-4", action: "packet_generated", entityType: "packet", entityId: "pkt-1", userId: "system", userName: "System", description: "Field packet v2 generated for JOB-1847", createdAt: "2026-03-10T14:00:00Z" },
  { id: "al-5", action: "file_uploaded", entityType: "file", entityId: "ds-2", userId: "usr-2", userName: "Sarah Westfield", description: "Uploaded spring-rx-herbicide-2026.zip to North 80", createdAt: "2026-03-01T08:00:00Z" },
  { id: "al-6", action: "job_created", entityType: "job", entityId: "job-1", userId: "usr-1", userName: "Robert Westfield", description: "Created spray job JOB-1847 for North 80 — Section 14", createdAt: "2026-03-05T14:30:00Z" },
  { id: "al-7", action: "file_uploaded", entityType: "file", entityId: "ds-4", userId: "usr-2", userName: "Sarah Westfield", description: "Uploaded planting-plan-corn-2026.zip to North 80", createdAt: "2026-02-20T09:00:00Z" },
  { id: "al-8", action: "boundary_uploaded", entityType: "field", entityId: "fld-1", userId: "usr-1", userName: "Robert Westfield", description: "Updated boundary to v3 for North 80 — Section 14", createdAt: "2026-01-15T10:00:00Z" },
  { id: "al-9", action: "job_completed", entityType: "job", entityId: "job-2", userId: "usr-4", userName: "Carlos Mendez", description: "Completed corn planting on River Bottom — East", createdAt: "2026-03-02T16:45:00Z" },
  { id: "al-10", action: "payment_received", entityType: "payment", entityId: "pay-1", userId: "usr-1", userName: "Robert Westfield", description: "Payment $2,584.06 received for INV-2901", createdAt: "2025-12-08T10:00:00Z" },
  { id: "al-11", action: "dispute_opened", entityType: "job", entityId: "job-8", userId: "usr-1", userName: "Robert Westfield", description: "Opened dispute DSP-1001 — acreage discrepancy on soybean harvest", createdAt: "2025-11-15T14:00:00Z" },
  { id: "al-12", action: "job_approved", entityType: "job", entityId: "job-4", userId: "usr-2", userName: "Sarah Westfield", description: "Approved completion of burndown spray on County Line Strip", createdAt: "2026-03-05T09:00:00Z" },
  { id: "al-13", action: "file_uploaded", entityType: "file", entityId: "ds-7", userId: "usr-3", userName: "Mike Brennan", description: "Uploaded field condition photo for North 80 pre-spray", createdAt: "2026-03-12T08:30:00Z" },
  { id: "al-14", action: "invoice_created", entityType: "invoice", entityId: "inv-1", userId: "usr-3", userName: "Mike Brennan", description: "Invoice INV-3021 created for JOB-1847 — $3,230.08", createdAt: "2026-03-14T10:00:00Z" },
];

export const notifications: Notification[] = [
  { id: "notif-1", userId: "usr-1", type: "warning", title: "Weather Delay — JOB-1847", message: "Spray job on North 80 paused due to incoming rain. 45/78 acres completed.", actionUrl: "/jobs/job-1", read: false, createdAt: "2026-03-12T16:35:00Z" },
  { id: "notif-2", userId: "usr-1", type: "action", title: "Invoice Received — INV-3021", message: "AgriPro Custom Services sent invoice for $3,230.08 for spring spray on North 80.", actionUrl: "/finance", read: false, createdAt: "2026-03-14T10:05:00Z" },
  { id: "notif-3", userId: "usr-1", type: "info", title: "Quote Received — Soil Sampling", message: "Prairie Partners submitted a quote of $2,907.00 for grid sampling on North 80 + Hilltop.", actionUrl: "/jobs/job-7", read: false, createdAt: "2026-03-11T09:35:00Z" },
  { id: "notif-4", userId: "usr-1", type: "info", title: "Quote Received — Soil Sampling", message: "AgriPro Custom Services submitted a quote of $3,343.00 for grid sampling.", actionUrl: "/jobs/job-7", read: true, createdAt: "2026-03-11T14:20:00Z" },
  { id: "notif-5", userId: "usr-1", type: "error", title: "Invoice Overdue — INV-2984", message: "Soybean harvest invoice from Prairie Partners is 102 days overdue. Amount: $5,919.82", actionUrl: "/finance", read: true, createdAt: "2026-03-20T08:00:00Z" },
  { id: "notif-6", userId: "usr-1", type: "warning", title: "Missing Packet Data — Hilltop Harvest", message: "Field packet for JOB-1845 is missing planting data. Upload required before execution.", actionUrl: "/fields/fld-3", read: false, createdAt: "2026-03-08T14:05:00Z" },
  { id: "notif-7", userId: "usr-1", type: "success", title: "Planting Complete — River Bottom", message: "Heartland Custom Farming completed corn planting on River Bottom — East. Review and approve proof of work.", actionUrl: "/jobs/job-2", read: true, createdAt: "2026-03-02T17:05:00Z" },
];

export const permissionGrants: PermissionGrant[] = [
  { id: "pg-1", entityType: "field", entityId: "fld-1", userId: "usr-1", userName: "Robert Westfield", userRole: "grower", level: "admin", grantedBy: "system", grantedByName: "System", createdAt: "2022-03-15T00:00:00Z" },
  { id: "pg-2", entityType: "field", entityId: "fld-1", userId: "usr-2", userName: "Sarah Westfield", userRole: "farm_manager", level: "manage", grantedBy: "usr-1", grantedByName: "Robert Westfield", createdAt: "2022-03-15T00:00:00Z" },
  { id: "pg-3", entityType: "field", entityId: "fld-1", userId: "usr-3", userName: "Mike Brennan", userRole: "operator", level: "view", grantedBy: "usr-1", grantedByName: "Robert Westfield", expiresAt: "2026-12-31T00:00:00Z", createdAt: "2026-03-08T00:00:00Z" },
  { id: "pg-4", entityType: "field", entityId: "fld-6", userId: "usr-8", userName: "Tom Kessler", userRole: "grower", level: "order_work", grantedBy: "usr-1", grantedByName: "Robert Westfield", createdAt: "2023-01-10T00:00:00Z" },
  { id: "pg-5", entityType: "field", entityId: "fld-6", userId: "usr-8", userName: "Tom Kessler", userRole: "grower", level: "approve_payment", grantedBy: "usr-1", grantedByName: "Robert Westfield", createdAt: "2023-01-10T00:00:00Z" },
  { id: "pg-6", entityType: "farm", entityId: "farm-1", userId: "usr-2", userName: "Sarah Westfield", userRole: "farm_manager", level: "manage", grantedBy: "usr-1", grantedByName: "Robert Westfield", createdAt: "2022-03-15T00:00:00Z" },
];

// ═══════════════════════════════════════════════════════
// LOOKUP HELPERS
// ═══════════════════════════════════════════════════════

export function getFieldById(id: string): Field | undefined {
  return fields.find(f => f.id === id);
}

export function getFieldsByFarm(farmId: string): Field[] {
  return fields.filter(f => f.farmId === farmId);
}

export function getJobById(id: string): Job | undefined {
  return jobs.find(j => j.id === id);
}

export function getJobsByField(fieldId: string): Job[] {
  return jobs.filter(j => j.fields.some(f => f.fieldId === fieldId));
}

export function getJobsByOperator(operatorId: string): Job[] {
  return jobs.filter(j => j.operatorId === operatorId);
}

export function getDatasetsByField(fieldId: string): DatasetAsset[] {
  return datasets.filter(d => d.fieldId === fieldId);
}

export function getAuditLogsByEntity(entityType: string, entityId: string): AuditLog[] {
  return auditLogs.filter(a => a.entityType === entityType && a.entityId === entityId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAuditLogsByField(fieldId: string): AuditLog[] {
  const fieldJobs = getJobsByField(fieldId);
  const fieldDatasets = getDatasetsByField(fieldId);
  const relatedIds = new Set([
    fieldId,
    ...fieldJobs.map(j => j.id),
    ...fieldDatasets.map(d => d.id),
    ...fieldPackets.filter(p => p.fieldId === fieldId).map(p => p.id),
    ...invoices.filter(inv => inv.fieldId === fieldId).map(inv => inv.id),
  ]);
  return auditLogs.filter(a => relatedIds.has(a.entityId)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMessagesByThread(threadId: string): Message[] {
  return messages.filter(m => m.threadId === threadId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getThreadsByField(fieldId: string): MessageThread[] {
  return messageThreads.filter(t => t.fieldId === fieldId).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export function getPermissionsByField(fieldId: string): PermissionGrant[] {
  return permissionGrants.filter(p => p.entityType === "field" && p.entityId === fieldId);
}

export function getInvoicesByField(fieldId: string): Invoice[] {
  return invoices.filter(inv => inv.fieldId === fieldId);
}

export function getFieldPacketByJob(jobId: string): FieldPacket | undefined {
  return fieldPackets.find(p => p.jobId === jobId);
}

export function getQuotesByJob(jobId: string): Quote[] {
  return quotes.filter(q => q.jobId === jobId);
}

export function getExceptionsByJob(jobId: string): JobException[] {
  return jobExceptions.filter(e => e.jobId === jobId);
}

export function getOperatorById(id: string): OperatorProfile | undefined {
  return operators.find(o => o.id === id || o.userId === id);
}

export function getEquipmentByOperator(operatorId: string): Equipment[] {
  return equipment.filter(e => e.operatorId === operatorId);
}

export function getCredentialsByOperator(operatorId: string): Credential[] {
  return credentials.filter(c => c.operatorId === operatorId);
}

export function getFieldRequirements(fieldId: string): FieldRequirement[] {
  return fieldRequirements.filter(r => r.fieldId === fieldId);
}

export function getFieldAccess(fieldId: string): FieldAccessInstruction | undefined {
  return fieldAccessInstructions[fieldId];
}

export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function getOrgById(id: string): Organization | undefined {
  return organizations.find(o => o.id === id);
}

export function getUnreadNotifications(): Notification[] {
  return notifications.filter(n => !n.read && n.userId === currentUser.id);
}
