// Auto-Fill Engine Type Definitions

// ==================== DOCUMENT PARSING TYPES ====================

export type DocumentFormat = 
  | 'pdf_fillable'
  | 'pdf_scanned'
  | 'word_docx'
  | 'xml_ted'
  | 'html_portal'
  | 'plain_text';

export type SemanticFieldType =
  // Company Information
  | 'company_legal_name'
  | 'registration_number'
  | 'registered_address'
  | 'company_website'
  | 'incorporation_date'
  | 'legal_structure'
  | 'sector'
  | 'sic_codes'
  | 'employee_count'
  | 'annual_revenue'
  // Project Information
  | 'project_title'
  | 'project_abstract'
  | 'project_duration'
  | 'project_start_date'
  | 'project_end_date'
  | 'total_project_cost'
  | 'funding_requested'
  // Team & Personnel
  | 'team_member_name'
  | 'team_member_role'
  | 'team_member_bio'
  | 'team_member_qualifications'
  | 'principal_investigator'
  | 'key_personnel'
  // Content Generation Fields
  | 'impact_statement'
  | 'risk_assessment'
  | 'innovation_description'
  | 'market_analysis'
  | 'competitor_analysis'
  | 'commercialisation_plan'
  | 'value_for_money'
  | 'public_engagement'
  // Financial
  | 'budget_breakdown'
  | 'cost_justification'
  | 'matching_funding'
  | 'cash_contribution'
  | 'in_kind_contribution'
  // Eligibility
  | 'eligibility_declaration'
  | 'state_aid_declaration'
  | 'conflict_of_interest'
  | 'previous_funding'
  // Attachments
  | 'financial_accounts'
  | 'governance_document'
  | 'organizational_chart'
  | 'supporting_letters';

export interface ParsedField {
  id: string;
  originalLabel: string;
  semanticType: SemanticFieldType;
  isMandatory: boolean;
  maxLength?: number;
  validationPattern?: string;
  helpText?: string;
  currentValue?: string | null;
  autoFillSource?: string | null;
  autoFillConfidence?: number | null; // 0-1
  requiresHumanReview: boolean;
  options?: Array<{ label: string; value: string }>; // For select/radio fields
  section?: string;
  order?: number;
}

export interface ConditionalRule {
  id: string;
  fieldId: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_set' | 'is_not_set';
  value?: any;
  action: 'show' | 'hide' | 'require' | 'optional';
  targetFieldIds: string[];
}

export interface AttachmentRequirement {
  id: string;
  label: string;
  acceptedTypes: string[];
  maxSizeMB: number;
  isMandatory: boolean;
  description?: string;
}

export interface ParsedDocument {
  format: DocumentFormat;
  sourceUrl?: string;
  sourceName?: string;
  title: string;
  description?: string;
  fields: ParsedField[];
  conditionalLogic: ConditionalRule[];
  attachmentsRequired: AttachmentRequirement[];
  confidence: number; // 0-1 parsing confidence
  metadata?: Record<string, any>;
  parsedAt: Date;
}

// ==================== KNOWLEDGE GRAPH TYPES ====================

export interface EntityNode {
  id: string;
  type: 'company' | 'person' | 'grant' | 'patent' | 'publication';
  label: string;
  properties: Record<string, any>;
  lastUpdated: Date;
}

export interface EntityEdge {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: RelationType;
  weight: number;
  since?: Date;
  metadata?: Record<string, any>;
}

export type RelationType =
  | 'founded_by'
  | 'funds'
  | 'funded_by'
  | 'partnered_with'
  | 'invested_in'
  | 'invested_by'
  | 'employs'
  | 'employed_by'
  | 'collaborates_with'
  | 'competes_with'
  | 'located_in'
  | 'operates_in_sector'
  | 'has_patent'
  | 'has_publication'
  | 'received_grant'
  | 'awarded_to';

export interface EnrichedEntity extends EntityNode {
  edges: EntityEdge[];
  relatedEntities: EntityNode[];
  computedFields: {
    fundingTotal: number;
    grantSuccessRate: number;
    partnershipCount: number;
    patentCount: number;
    publicationCount: number;
    sectorRelevance: number;
  };
}

// ==================== RESOLUTION CONTEXT ====================

export interface ResolveContext {
  userId: string;
  companyId?: string;
  grantProgrammeId?: string;
  applicationId?: string;
  userRole?: string;
  existingData?: Record<string, any>;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  writingStyle: 'formal' | 'academic' | 'business' | 'technical';
  tone: 'professional' | 'persuasive' | 'neutral';
  detailLevel: 'concise' | 'standard' | 'comprehensive';
  includeMetrics: boolean;
  includeCitations: boolean;
}

// ==================== FIELD RESOLUTION ====================

export interface ResolvedValue {
  value: string;
  confidence: number; // 0-1
  source: FieldSource;
  sourceDetails: string;
  requiresReview: boolean;
  reviewReasons?: string[];
  alternatives?: Array<{
    value: string;
    confidence: number;
    source: FieldSource;
  }>;
}

export type FieldSource =
  | 'user_profile'
  | 'company_data'
  | 'knowledge_graph'
  | 'llm_generated'
  | 'previous_application'
  | 'manual_input'
  | 'external_api'
  | 'default_value'
  | 'not_resolved';

// ==================== APPLICATION FILL RESULT ====================

export interface ApplicationFillResult {
  applicationId: string;
  status: 'processing' | 'completed' | 'partial' | 'failed';
  totalFields: number;
  autoFilledFields: number;
  reviewedFields: number;
  manualFields: number;
  autoFillPercentage: number;
  estimatedTimeSaved: number; // in minutes
  timeTaken: number; // processing time in ms
  fields: ProcessedField[];
  warnings: string[];
  errors: string[];
}

export interface ProcessedField extends ParsedField {
  resolutionStatus: 'auto_filled' | 'requires_review' | 'manual' | 'skipped';
  resolvedValue?: string;
  resolvedConfidence?: number;
  resolvedSource?: FieldSource;
  reviewNotes?: string;
}

// ==================== LLM GENERATION TYPES ====================

// Named interfaces for complex types to avoid parser issues
export interface TeamMember {
  name: string;
  role: string;
  qualifications: string[];
}

export interface BudgetItem {
  category: string;
  amount: number;
  justification: string;
}

export interface TimelineMilestone {
  date: string;
  description: string;
  deliverable: string;
}

export interface CompanyInfo {
  name: string;
  description: string;
  sector: string;
  size: string;
  achievements: string[];
}

export interface BudgetInfo {
  total: number;
  breakdown: BudgetItem[];
}

export interface TimelineInfo {
  start: string;
  end: string;
  milestones: TimelineMilestone[];
}

export interface ProjectProfile {
  title: string;
  abstract: string;
  company: CompanyInfo;
  team: TeamMember[];
  budget: BudgetInfo;
  timeline: TimelineInfo;
}

export interface AbstractRequirements {
  maxWords: number;
  focusAreas: string[];
  evaluationCriteria: string[];
  styleGuide: string;
  examples?: string[];
}

export interface ImpactDimension {
  name: string;
  description: string;
  metrics: string[];
  weighting: number;
}

export interface ImpactFramework {
  dimensions: ImpactDimension[];
  timeframe: string;
  stakeholders: string[];
}

export interface GeneratedContent {
  content: string;
  wordCount: number;
  readingTime: number; // minutes
  confidence: number;
  suggestions?: string[];
  references?: string[];
}

export interface ReadingScore {
  gradeLevel: number;
  fleschKincaid: number;
  colemanLiau: number;
  wordsPerSentence: number;
  syllablesPerWord: number;
}

export interface SimilarityMatch {
  text: string;
  reference: string;
  similarity: number;
}

export interface SimilarityScore {
  percentage: number;
  matches: SimilarityMatch[];
  overallAssessment: string;
}

// ==================== SUBMISSION TYPES ====================

export interface Attachment {
  fieldId: string;
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
}

export interface CompletedApplication {
  applicationId: string;
  grantProgrammeId: string;
  formData: Record<string, any>;
  attachments: Attachment[];
  submittedAt: Date;
}

export interface PortalConfig {
  portalType: 'api' | 'rpa' | 'file_upload' | 'manual';
  baseUrl?: string;
  apiEndpoint?: string;
  authMethod?: 'oauth2' | 'api_key' | 'cookie';
  credentials?: Record<string, string>;
  formSelectors?: Record<string, string>;
  uploadEndpoint?: string;
}

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  submissionReference?: string;
  confirmationPage?: string;
  timestamp: Date;
  method: 'api' | 'rpa' | 'file_package';
  proofOfSubmission?: ProofOfSubmission;
  error?: string;
  retryPossible: boolean;
}

export interface ProofOfSubmission {
  type: 'screenshot' | 'receipt' | 'email_confirmation' | 'reference_number';
  data: string; // Base64 or URL or text
  capturedAt: Date;
  verified: boolean;
}

export interface PackageFile {
  filename: string;
  content: Buffer | string;
  mimeType: string;
}

export interface FilePackage {
  applicationId: string;
  files: PackageFile[];
  manifest: {
    generatedAt: Date;
    format: string;
    version: string;
  };
}
