// ═══════════════════════════════════════════════════════
// ProlificHire Domain Model — Full Typed System
// ═══════════════════════════════════════════════════════

// ── Enums ──────────────────────────────────────────────

export type UserRole = "grower" | "operator" | "farm_manager" | "admin" | "finance";

export type JobStatus =
  | "draft" | "requested" | "quoted" | "accepted" | "scheduled"
  | "in_progress" | "delayed" | "completed" | "approved"
  | "invoiced" | "paid" | "closed" | "cancelled" | "disputed";

export type OperationType =
  | "spraying" | "planting" | "harvest" | "tillage"
  | "hauling" | "grain_hauling" | "scouting" | "soil_sampling" | "fertilizing"
  | "seeding" | "mowing" | "baling" | "drainage" | "rock_picking" | "other";

export type PricingModel = "per_acre" | "per_hour" | "flat_rate" | "negotiated";

export type CropType =
  | "corn" | "soybeans" | "wheat" | "alfalfa" | "oats"
  | "sorghum" | "sunflower" | "canola" | "cotton"
  | "rice" | "barley" | "cover_crop" | "other";

export type FileCategory =
  | "boundary" | "prescription" | "planting" | "as_applied"
  | "harvest" | "soil_sample" | "photo" | "access_instructions"
  | "operator_notes" | "completion_photo" | "machine_data"
  | "invoice_doc" | "insurance" | "certification" | "other";

export type FileFormat =
  | "geojson" | "shapefile" | "kml" | "csv" | "pdf"
  | "png" | "jpg" | "zip" | "isoxml" | "other";

export type PacketStatus = "pending" | "generating" | "ready" | "downloaded" | "expired" | "regenerating";

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export type DisputeStatus = "opened" | "under_review" | "resolved" | "escalated" | "closed";

export type ExceptionType =
  | "weather_delay" | "partial_completion" | "no_show"
  | "field_inaccessible" | "missing_data" | "scope_change"
  | "pricing_change" | "equipment_failure" | "dispute";

export type AuditAction =
  | "field_created" | "field_updated" | "boundary_uploaded" | "boundary_approved"
  | "job_created" | "job_quoted" | "job_accepted" | "job_scheduled"
  | "job_started" | "job_completed" | "job_approved" | "job_cancelled"
  | "file_uploaded" | "file_downloaded" | "file_deleted"
  | "packet_generated" | "packet_downloaded"
  | "invoice_created" | "payment_received" | "payout_sent"
  | "change_order_created" | "change_order_approved"
  | "exception_raised" | "dispute_opened" | "dispute_resolved"
  | "permission_granted" | "permission_revoked"
  | "credential_uploaded" | "credential_expired"
  | "message_sent" | "review_submitted" | "comment_added";

export type PermissionLevel = "view" | "order_work" | "upload_files" | "approve_payment" | "manage" | "admin";

export type CredentialType = "insurance" | "license" | "certification" | "registration" | "bond";

// ── Core Entities ──────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  organizationId: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: "farm" | "operator" | "management" | "admin";
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website?: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  grantedAt: string;
  grantedBy: string;
}

// ── Farm & Field ──────────────────────────────────────

export interface Farm {
  id: string;
  name: string;
  organizationId: string;
  ownerId: string;
  tenantId?: string;
  county: string;
  state: string;
  totalAcres: number;
  fieldCount: number;
  createdAt: string;
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  legalDescription?: string;
  county: string;
  state: string;
  crop: CropType;
  cropYear: number;
  acreage: number;
  centroid: { lat: number; lng: number };
  boundingBox: { north: number; south: number; east: number; west: number };
  currentJobId?: string;
  currentOperatorId?: string;
  status: "idle" | "active" | "pending" | "restricted";
  cluNumber?: string;
  fsa_farm_number?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FieldBoundary {
  id: string;
  fieldId: string;
  version: number;
  geometry: object; // GeoJSON
  sourceFormat: FileFormat;
  sourceFileId: string;
  acreageCalculated: number;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface FieldStats {
  fieldId: string;
  totalJobs: number;
  totalSpend: number;
  totalPaid: number;
  totalOutstanding: number;
  operatorsUsed: number;
  filesUploaded: number;
  lastJobDate?: string;
  lastOperator?: string;
  avgCostPerAcre: number;
  cropYears: number[];
}

export interface FieldRequirement {
  id: string;
  fieldId: string;
  type: "buffer_zone" | "restricted_product" | "timing_restriction" | "equipment_requirement" | "speed_limit" | "custom";
  description: string;
  severity: "info" | "warning" | "critical";
  appliesTo: OperationType[];
  createdAt: string;
  createdBy: string;
}

export interface FieldAccessInstruction {
  id: string;
  fieldId: string;
  directions: string;
  gateCode?: string;
  contactName?: string;
  contactPhone?: string;
  hazards?: string;
  notes?: string;
  updatedAt: string;
  updatedBy: string;
}

// ── Operator ──────────────────────────────────────────

export interface OperatorProfile {
  id: string;
  userId: string;
  organizationId: string;
  businessName: string;
  serviceTypes: OperationType[];
  serviceRadius: number; // miles
  baseLat: number;
  baseLng: number;
  baseAddress: string;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  isVerified: boolean;
  insuranceVerified: boolean;
  bio?: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  operatorId: string;
  type: string;
  make: string;
  model: string;
  year: number;
  width?: number; // feet
  capacity?: string;
  gpsEquipped: boolean;
  isoCompatible: boolean;
  status: "active" | "maintenance" | "retired";
}

export interface Credential {
  id: string;
  operatorId: string;
  type: CredentialType;
  name: string;
  issuer: string;
  number: string;
  issuedAt: string;
  expiresAt: string;
  fileId?: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  status: "active" | "expiring_soon" | "expired" | "pending_verification";
}

export interface RateCard {
  id: string;
  operatorId: string;
  operationType: OperationType;
  pricingModel: PricingModel;
  baseRate: number;
  minimumFee: number;
  travelFeePerMile?: number;
  urgencySurchargePercent?: number;
  materialPassthrough: boolean;
  validFrom: string;
  validTo?: string;
}

// ── Job ───────────────────────────────────────────────

export interface Job {
  id: string;
  displayId: string;
  farmId: string;
  requestedBy: string;
  operationType: OperationType;
  status: JobStatus;
  urgency: "normal" | "urgent" | "critical";
  title: string;
  description?: string;
  notes?: string;
  requirements?: string;
  fields: JobField[];
  operatorId?: string;
  operatorName?: string;
  pricingModel: PricingModel;
  baseRate: number;
  totalAcres: number;
  estimatedTotal: number;
  approvedTotal?: number;
  invoicedTotal?: number;
  paidTotal?: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  deadline: string;
  travelDistance?: number;
  travelEta?: number;
  splitPayment: boolean;
  splitRules?: SplitRule[];
  packetId?: string;
  packetStatus?: PacketStatus;
  proofSubmitted: boolean;
  proofApproved: boolean;
  changeOrderCount: number;
  exceptionCount: number;
  inputs?: JobInput[];
  createdAt: string;
  updatedAt: string;
}

export type ProductType = "seed" | "fertilizer" | "chemical" | "adjuvant" | "other";
export type SuppliedBy = "grower" | "operator";

export interface JobInput {
  id: string;
  jobId: string;
  productName: string;
  productType: ProductType;
  brand?: string;
  variant?: string;
  quantity?: number;
  unit?: string;
  suppliedBy: SuppliedBy;
  pickupRequired: boolean;
  pickupLocationName?: string;
  pickupAddress?: string;
  pickupCity?: string;
  pickupState?: string;
  pickupZip?: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupContact?: string;
  pickupPhone?: string;
  pickupInstructions?: string;
  handlingNotes?: string;
  safetyNotes?: string;
  estimatedPickupDistance?: number;
  estimatedPickupTime?: number;
  sequence: number;
}

export interface JobField {
  id: string;
  jobId: string;
  fieldId: string;
  fieldName: string;
  acreage: number;
  crop: CropType;
  sequence: number;
  status: "pending" | "in_progress" | "completed" | "skipped";
}

export interface Quote {
  id: string;
  jobId: string;
  operatorId: string;
  operatorName: string;
  pricingModel: PricingModel;
  baseRate: number;
  travelFee: number;
  materialCost: number;
  totalQuote: number;
  notes?: string;
  validUntil: string;
  status: "pending" | "accepted" | "declined" | "expired" | "countered";
  submittedAt: string;
}

export interface Booking {
  id: string;
  jobId: string;
  operatorId: string;
  confirmedAt: string;
  confirmedBy: string;
  scheduledStart: string;
  scheduledEnd: string;
  travelDistance: number;
  travelEta: number;
  packetDelivered: boolean;
  status: "confirmed" | "modified" | "cancelled";
}

export interface ScheduleWindow {
  id: string;
  jobId: string;
  fieldId: string;
  proposedStart: string;
  proposedEnd: string;
  confirmedStart?: string;
  confirmedEnd?: string;
  weatherClear: boolean;
  notes?: string;
}

export interface JobEvent {
  id: string;
  jobId: string;
  type: AuditAction;
  description: string;
  userId: string;
  userName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ChangeOrder {
  id: string;
  jobId: string;
  requestedBy: string;
  reason: string;
  originalScope: string;
  updatedScope: string;
  originalPrice: number;
  updatedPrice: number;
  status: "pending" | "approved" | "declined";
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface JobException {
  id: string;
  jobId: string;
  type: ExceptionType;
  description: string;
  raisedBy: string;
  raisedByName: string;
  status: "open" | "acknowledged" | "resolved" | "escalated";
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface ProofOfWork {
  id: string;
  jobId: string;
  fieldId: string;
  operatorId: string;
  actualAcres: number;
  completionNotes: string;
  photoIds: string[];
  machineDataFileId?: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  status: "submitted" | "approved" | "rejected" | "auto_approved";
}

// ── Data & Files ──────────────────────────────────────

export interface DatasetAsset {
  id: string;
  fieldId: string;
  jobId?: string;
  category: FileCategory;
  format: FileFormat;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  cropYear: number;
  operationType?: OperationType;
  operatorId?: string;
  operatorName?: string;
  uploadedBy: string;
  uploadedByName: string;
  description?: string;
  isLatest: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface FieldPacket {
  id: string;
  jobId: string;
  fieldId: string;
  version: number;
  status: PacketStatus;
  operatorId: string;
  files: FieldPacketFile[];
  missingRequired: string[];
  generatedAt: string;
  generatedBy: string;
  approvedForExecution: boolean;
  approvedAt?: string;
  downloadCount: number;
  lastDownloadAt?: string;
  lastDownloadBy?: string;
  expiresAt?: string;
}

export interface FieldPacketFile {
  id: string;
  packetId: string;
  datasetId: string;
  category: FileCategory;
  fileName: string;
  fileSize: number;
  format: FileFormat;
  version: number;
  included: boolean;
  required: boolean;
}

// ── Financial ─────────────────────────────────────────

export interface Invoice {
  id: string;
  displayId: string;
  jobId: string;
  fieldId: string;
  issuedTo: string;
  issuedToName: string;
  issuedBy: string;
  issuedByName: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  fees: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "voided";
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  payerId: string;
  payerName: string;
  amount: number;
  method: "ach" | "card" | "wire" | "check";
  status: PaymentStatus;
  stripePaymentId?: string;
  processedAt?: string;
  createdAt: string;
}

export interface SplitRule {
  id: string;
  jobId: string;
  payerId: string;
  payerName: string;
  payerRole: "owner" | "tenant" | "manager" | "other";
  percentage: number;
  fixedAmount?: number;
  invoiceId?: string;
  status: "pending" | "invoiced" | "paid";
}

export interface Payout {
  id: string;
  operatorId: string;
  operatorName: string;
  jobId: string;
  invoiceId: string;
  grossAmount: number;
  platformFee: number;
  processingFee: number;
  netAmount: number;
  status: "pending" | "processing" | "completed" | "failed";
  stripeTransferId?: string;
  estimatedArrival?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  displayId: string;
  jobId: string;
  fieldId: string;
  raisedBy: string;
  raisedByName: string;
  againstId: string;
  againstName: string;
  reason: string;
  description: string;
  amountDisputed: number;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

// ── Social ────────────────────────────────────────────

export interface Review {
  id: string;
  jobId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  jobId?: string;
  fieldId?: string;
  subject: string;
  participants: { userId: string; userName: string; role: UserRole }[];
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  attachmentIds?: string[];
  readBy: string[];
  createdAt: string;
}

// ── System ────────────────────────────────────────────

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: "field" | "job" | "file" | "packet" | "invoice" | "payment" | "user" | "credential" | "permission";
  entityId: string;
  userId: string;
  userName: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "info" | "warning" | "action" | "success" | "error";
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface PermissionGrant {
  id: string;
  entityType: "field" | "farm" | "organization";
  entityId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  level: PermissionLevel;
  grantedBy: string;
  grantedByName: string;
  expiresAt?: string;
  createdAt: string;
}

// ── Operation Specifications ─────────────────────────

export type RateType = "flat" | "split" | "variable_rate" | "zone_based" | "see_and_spray";
export type ProductForm = "dry" | "liquid" | "gas" | "granular" | "other";
export type ContractType = "work_authorization" | "payment_agreement";
export type ContractStatus = "draft" | "pending_signature" | "partially_signed" | "fully_signed" | "expired" | "voided";
export type SignatureStatus = "pending" | "signed" | "declined" | "expired";
export type CommMethod = "in_app" | "email" | "sms" | "phone";

export interface PlantingSpec {
  seedBrand: string;
  productLine: string;
  hybridVariety: string;
  traitPackage: string;
  treatment: string;
  targetPopulation: number;
  variableRate: boolean;
  prescriptionRequired: boolean;
  rowSpacing: number;
  plantingDepthNotes: string;
  seedSuppliedBy: "owner" | "operator";
}

export interface ApplicationSpec {
  productCategory: string;
  productBrandBlend: string;
  form: ProductForm;
  rateType: RateType;
  targetRate: number;
  rateUnits: string;
  numberOfPasses: number;
  passTiming: string;
  operatorSuppliesProduct: boolean;
  prescriptionRequired: boolean;
  restrictedEntryNotes: string;
  specialRequirements: string;
}

export interface HarvestSpec {
  cropType: CropType;
  conditionMoistureNotes: string;
  unloadLogisticsNotes: string;
  plantingFileAttached: boolean;
  boundaryFileAttached: boolean;
  yieldDataSharingExpected: boolean;
  machineDataRequired: boolean;
}

export interface MowingSpec {
  cuttingType: "first_cutting" | "second_cutting" | "third_cutting" | "fourth_cutting" | "other";
  cropType: "alfalfa" | "grass_hay" | "mixed_hay" | "clover" | "timothy" | "orchard_grass" | "other";
  conditionerRequired: boolean;
  conditionerType: string;
  cuttingHeight: string;
  swathWidth: string;
  teddingRequired: boolean;
  rakingRequired: boolean;
  estimatedDryTime: string;
  fieldConditionNotes: string;
  boundaryFileAttached: boolean;
}

export interface BalingSpec {
  baleType: "small_square" | "large_square" | "large_round" | "other";
  baleSize: string;
  baleWeight: string;
  estimatedBaleCount: number;
  twineOrWrapType: "twine" | "net_wrap" | "plastic_wrap" | "sisal";
  moistureTarget: string;
  stackingRequired: boolean;
  stackingLocation: string;
  loadingRequired: boolean;
  haulingRequired: boolean;
  haulingDestination: string;
  preservativeRequired: boolean;
  preservativeType: string;
  fieldConditionNotes: string;
  boundaryFileAttached: boolean;
}

export interface RockPickingSpec {
  rockDensity: "low" | "medium" | "high";
  estimatedRockSize: "small" | "mixed" | "large" | "boulders";
  equipmentType: string;
  disposalMethod: "pile_on_field" | "haul_off" | "pile_at_edge" | "other";
  disposalLocation: string;
  fieldConditionNotes: string;
  boundaryFileAttached: boolean;
}

export type OperationSpecData = PlantingSpec | ApplicationSpec | HarvestSpec | MowingSpec | BalingSpec | RockPickingSpec;

export interface OperationSpec {
  id: string;
  jobId: string;
  operationType: OperationType;
  specData: OperationSpecData;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  organizationId: string;
  type: "headquarters" | "yard" | "shop" | "access_point";
  label: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
}

export interface CommunicationPreferences {
  id: string;
  userId: string;
  preferredMethod: CommMethod;
  alternatePhone?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  notifyQuotes: boolean;
  notifyScheduling: boolean;
  notifyDelays: boolean;
  notifyPackets: boolean;
  notifyApprovals: boolean;
  notifyInvoices: boolean;
  notifyPayouts: boolean;
  notifyContracts: boolean;
}

export interface ServiceArea {
  id: string;
  operatorProfileId: string;
  state: string;
  county?: string;
}

export interface Contract {
  id: string;
  jobId: string;
  type: ContractType;
  status: ContractStatus;
  title: string;
  contentHtml?: string;
  fieldsIncluded: string[];
  terms: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  fullySignedAt?: string;
  signatures: ContractSignature[];
}

export interface ContractSignature {
  id: string;
  contractId: string;
  signerId: string;
  signerName: string;
  signerRole: string;
  status: SignatureStatus;
  signedAt?: string;
  createdAt: string;
}
