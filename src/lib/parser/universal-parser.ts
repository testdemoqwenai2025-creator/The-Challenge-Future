// Universal Document Parser
// Parses various document formats into a unified ParsedDocument structure

import {
  ParsedDocument,
  ParsedField,
  ConditionalRule,
  AttachmentRequirement,
  DocumentFormat,
  SemanticFieldType,
} from "./types";

// Field type mapping patterns for semantic classification
const FIELD_TYPE_PATTERNS: Array<{ pattern: RegExp; type: SemanticFieldType; confidence: number }> = [
  // Company fields
  { pattern: /company\s*(legal\s*)?name|organisation\s*name|applicant\s*name/i, type: 'company_legal_name', confidence: 0.95 },
  { pattern: /registration\s*number|company\s*number|companies?\s*house/i, type: 'registration_number', confidence: 0.95 },
  { pattern: /registered\s*(office\s*)?address|business\s*address|postal\s*address/i, type: 'registered_address', confidence: 0.9 },
  { pattern: /website|web\s*address|url/i, type: 'company_website', confidence: 0.9 },
  { pattern: /incorporation\s*date|date\s*(of\s*)?(incorporation|formation)|founded/i, type: 'incorporation_date', confidence: 0.9 },
  { pattern: /legal\s*(structure|form|status)|company\s*type|entity\s*type/i, type: 'legal_structure', confidence: 0.85 },
  { pattern: /sector|industry|field|area\s*of\s*(research|activity)/i, type: 'sector', confidence: 0.85 },
  { pattern: /sic\s*codes?|classification\s*code/i, type: 'sic_codes', confidence: 0.9 },
  { pattern: /employee(s)?\s*(count|number)|(staff|workforce)\s*size/i, type: 'employee_count', confidence: 0.9 },
  { pattern: /annual\s*(revenue|turnover|income)/i, type: 'annual_revenue', confidence: 0.9 },
  
  // Project fields
  { pattern: /project\s*title|(grant|application)\s*title|proposal\s*title/i, type: 'project_title', confidence: 0.95 },
  { pattern: /(project\s*)?abstract|summary|executive\s*summary|overview/i, type: 'project_abstract', confidence: 0.9 },
  { pattern: /project\s*duration|timeline|period/i, type: 'project_duration', confidence: 0.85 },
  { pattern: /(project\s*)?start\s*date|commencement/i, type: 'project_start_date', confidence: 0.9 },
  { pattern: /(project\s*)?(end|completion)\s*date|completion/i, type: 'project_end_date', confidence: 0.9 },
  { pattern: /total\s*(project)?\s*cost|full\s*project\s*cost|total\s*expenditure/i, type: 'total_project_cost', confidence: 0.9 },
  { pattern: /funding\s*(requested|required|amount)|grant\s*(amount|value)|ask/i, type: 'funding_requested', confidence: 0.95 },
  
  // Team fields
  { pattern: /team\s*member(\s*name)?|personnel\s*name|staff\s*name/i, type: 'team_member_name', confidence: 0.85 },
  { pattern: /team\s*(member\s*)?role|position|job\s*title/i, type: 'team_member_role', confidence: 0.85 },
  { pattern: /team\s*(member\s*)?(bio|biography|profile)|cv|curriculum/i, type: 'team_member_bio', confidence: 0.85 },
  { pattern: /qualification(s)?|credential(s)?|certification(s)?/i, type: 'team_member_qualifications', confidence: 0.8 },
  { pattern: /principal\s*(investigator|researcher)|(pi|lead)\s*investigator/i, type: 'principal_investigator', confidence: 0.95 },
  { pattern: /key\s*personnel|senior\s*personnel|core\s*team/i, type: 'key_personnel', confidence: 0.85 },
  
  // Content generation fields (LLM targets)
  { pattern: /impact\s*(statement|assessment|plan)|expected\s*(outcome|impact|benefit)/i, type: 'impact_statement', confidence: 0.9 },
  { pattern: /risk\s*(assessment|analysis|management)|potential\s*risk/i, type: 'risk_assessment', confidence: 0.9 },
  { pattern: /innovation|novelty|originality|state\s*of\s*the\s*art/i, type: 'innovation_description', confidence: 0.85 },
  { pattern: /market\s*(analysis|size|opportunity)|commercial\s*(landscape|potential)/i, type: 'market_analysis', confidence: 0.85 },
  { pattern: /competitor|competition|competitive\s*(landscape|analysis)/i, type: 'competitor_analysis', confidence: 0.85 },
  { pattern: /commercial(isation)?\s*(plan|strategy)|exploitation\s*plan/i, type: 'commercialisation_plan', confidence: 0.9 },
  { pattern: /value\s*(for\s*)?money|cost\s*effectiveness|efficiency/i, type: 'value_for_money', confidence: 0.85 },
  { pattern: /public\s*(engagement|outreach|communication)|dissemination/i, type: 'public_engagement', confidence: 0.85 },
  
  // Financial fields
  { pattern: /budget\s*(breakdown|table|details)|financial\s*breakdown/i, type: 'budget_breakdown', confidence: 0.9 },
  { pattern: /cost\s*justification|price\s*justification|expenditure\s*detail/i, type: 'cost_justification', confidence: 0.9 },
  { pattern: /matching\s*funding|match\s*funding|co.funding/i, type: 'matching_funding', confidence: 0.9 },
  { pattern: /cash\s*contribution|own\s*resources/i, type: 'cash_contribution', confidence: 0.9 },
  { pattern: /in.kind\s*contribution|non.cash/i, type: 'in_kind_contribution', confidence: 0.9 },
  
  // Eligibility fields
  { pattern: /eligib(ility|le)|declaration|confirm/i, type: 'eligibility_declaration', confidence: 0.8 },
  { pattern: /state\s*aid|de.minimis|subsidy/i, type: 'state_aid_declaration', confidence: 0.9 },
  { pattern: /conflict\s*(of\s*)?interest|disclosure/i, type: 'conflict_of_interest', confidence: 0.9 },
  { pattern: /previous\s*funding|prior\s*(support|award)|existing\s*funding/i, type: 'previous_funding', confidence: 0.85 },
];

class UniversalDocumentParser {
  
  /**
   * Parse a document from URL or content
   */
  async parseDocument(input: string | object, format?: DocumentFormat): Promise<ParsedDocument> {
    // Detect format if not provided
    const detectedFormat = format || this.detectFormat(input);
    
    switch (detectedFormat) {
      case "xml_ted":
        return this.parseTEDXML(typeof input === "string" ? input : JSON.stringify(input));
      
      case "html_portal":
        return this.parseHTMLPortal(typeof input === "string" ? input : "");
      
      case "pdf_fillable":
      case "pdf_scanned":
        return this.parsePDFMetadata(typeof input === "object" ? input : {});
      
      case "word_docx":
        return this.parseWordDocx(typeof input === "object" ? input : {});
      
      case "plain_text":
      default:
        return this.parsePlainText(typeof input === "string" ? input : JSON.stringify(input));
    }
  }

  /**
   * Detect document format from input
   */
  private detectFormat(input: string | object): DocumentFormat {
    if (typeof input === "string") {
      if (input.includes("<TED_EXPORT") || input.includes("<FORM_SECTION")) return "xml_ted";
      if (input.includes("<!DOCTYPE html") || input.includes("<html")) return "html_portal";
      if (input.startsWith("%PDF") || input.includes("/Type /Catalog")) return "pdf_scanned";
      if (input.includes("w:document") || input.includes("word/document.xml")) return "word_docx";
      return "plain_text";
    }
    
    // Object input - could be PDF form data or Word doc structure
    if ("fields" in input) return "pdf_fillable";
    if ("document" in input || "body" in input) return "word_docx";
    return "plain_text";
  }

  /**
   * Parse TED (Tenders Electronic Daily) XML format
   */
  private parseTEDXML(xmlContent: string): ParsedDocument {
    const fields: ParsedField[] = [];
    
    // Extract title
    const titleMatch = xmlContent.match(/<TITLE>([\s\S]*?)<\/TITLE>/);
    const title = titleMatch 
      ? titleMatch[1].replace(/<[^>]*>/g, "").trim() 
      : "EU Grant Application Form";

    // Extract form sections and fields
    // This is a simplified parser - real implementation would use proper XML parsing
    
    // Common TED form fields
    const tedFieldMappings: Array<{ xpath: string; label: string; type: SemanticFieldType; mandatory: boolean }> = [
      { xpath: "//NOTICE_DATA/NO_DOC_OJS", label: "Notice Number", type: 'registration_number', mandatory: false },
      { xpath: "//CONTRACTING_BODY/OFFICIALNAME", label: "Organisation Name", type: 'company_legal_name', mandatory: true },
      { xpath: "//CONTRACTING_ADDRESS/OFFICIALNAME", label: "Organisation Address", type: 'registered_address', mandatory: true },
      { xpath: "//CONTRACTING_ADDRESS/TOWN", label: "Town/City", type: 'registered_address', mandatory: true },
      { xpath: "//CONTRACTING_ADDRESS/POSTAL_CODE", label: "Postal Code", type: 'registered_address', mandatory: true },
      { xpath: "//OBJECT_DESCR/SHORT_DESCR", label: "Project Description", type: 'project_abstract', mandatory: true },
      { xpath: "//OBJECT_DESCR/AC_COST", label: "Total Cost", type: 'total_project_cost', mandatory: true },
      { xpath: "//OBJECT_DESCR/VAL_TOTAL", label: "Total Value", type: 'funding_requested', mandatory: true },
      { xpath: "//OBJECT_DESCR/DATE_START", label: "Start Date", type: 'project_start_date', mandatory: true },
      { xpath: "//OBJECT_DESCR/DATE_END", label: "End Date", type: 'project_end_date', mandatory: true },
    ];

    let fieldIndex = 0;
    for (const mapping of tedFieldMappings) {
      const valueMatch = new RegExp(`<${mapping.xpath.split("/").pop()}>([\\s\\S]*?)<\/${mapping.xpath.split("/").pop()}>`).exec(xmlContent);
      
      fields.push({
        id: `field_${fieldIndex++}`,
        originalLabel: mapping.label,
        semanticType: mapping.type,
        isMandatory: mapping.mandatory,
        currentValue: valueMatch?.[1]?.replace(/<[^>]*>/g, "").trim(),
        autoFillSource: valueMatch ? "xml_parsed" : null,
        autoFillConfidence: valueMatch ? 1.0 : null,
        requiresHumanReview: !mapping.mandatory,
        section: this.getSectionForType(mapping.type),
        order: fieldIndex,
      });
    }

    // Add LLM-generated field placeholders
    fields.push(...this.getLLMGeneratedFields(fieldIndex));

    return {
      format: "xml_ted",
      sourceName: "EU TED",
      title,
      fields,
      conditionalLogic: this.generateConditionalRules(fields),
      attachmentsRequired: [
        {
          id: "att_1",
          label: "Financial Statements",
          acceptedTypes: ["application/pdf"],
          maxSizeMB: 10,
          isMandatory: true,
          description: "Last 2 years audited accounts",
        },
        {
          id: "att_2",
          label: "Organisational Chart",
          acceptedTypes: ["application/pdf", "image/png"],
          maxSizeMB: 5,
          isMandatory: false,
        },
      ],
      confidence: 0.92,
      parsedAt: new Date(),
    };
  }

  /**
   * Parse HTML portal forms
   */
  private parseHTMLPortal(htmlContent: string): ParsedDocument {
    const fields: ParsedField[] = [];
    
    // Extract form title
    const titleMatch = htmlContent.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    const title = titleMatch 
      ? titleMatch[1].replace(/<[^>]*>/g, "").trim()
      : "Grant Application Form";

    // Parse form inputs
    const inputPatterns = [
      { regex: /<input[^>]+name=["']([^"']+)["'][^>]*(?:placeholder=["']([^"']*)["'])?[^>]*>/gi, type: "text" as const },
      { regex: /<textarea[^>]+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/textarea>/gi, type: "textarea" as const },
      { regex: /<select[^>]+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi, type: "select" as const },
    ];

    let fieldIndex = 0;

    for (const pattern of inputPatterns) {
      let match;
      while ((match = pattern.regex.exec(htmlContent)) !== null) {
        const name = match[1];
        const placeholder = match[2] || "";
        
        const semanticType = this.classifyFieldByLabel(name + " " + placeholder);
        
        fields.push({
          id: `field_${fieldIndex++}`,
          originalLabel: this.formatLabel(name),
          semanticType,
          isMandatory: htmlContent.includes(`required`) || name.toLowerCase().includes("required"),
          helpText: placeholder || undefined,
          requiresHumanReview: this.requiresReview(semanticType),
          section: this.getSectionForType(semanticType),
          order: fieldIndex,
        });
      }
    }

    // If no fields found via HTML parsing, use template
    if (fields.length === 0) {
      fields.push(...this.getTemplateFields());
    } else {
      // Ensure LLM-generated fields are included
      fields.push(...this.getLLMGeneratedFields(fieldIndex));
    }

    return {
      format: "html_portal",
      title,
      fields,
      conditionalLogic: this.generateConditionalRules(fields),
      attachmentsRequired: this.getDefaultAttachments(),
      confidence: 0.88,
      parsedAt: new Date(),
    };
  }

  /**
   * Parse PDF metadata/form fields
   */
  private parsePDFMetadata(data: object): ParsedDocument {
    const fields: ParsedField[] = [];
    
    // PDF form fields would be extracted here
    // For now, create template based on common grant application forms
    
    fields.push(...this.getTemplateFields());
    fields.push(...this.getLLMGeneratedFields(fields.length));

    return {
      format: "pdf_fillable",
      title: "Grant Application Form (PDF)",
      fields,
      conditionalLogic: this.generateConditionalRules(fields),
      attachmentsRequired: this.getDefaultAttachments(),
      confidence: 0.75,
      metadata: data,
      parsedAt: new Date(),
    };
  }

  /**
   * Parse Word document structure
   */
  private parseWordDocx(_data: object): ParsedDocument {
    const fields: ParsedField[] = [];
    
    fields.push(...this.getTemplateFields());
    fields.push(...this.getLLMGeneratedFields(fields.length));

    return {
      format: "word_docx",
      title: "Grant Application Form (Word)",
      fields,
      conditionalLogic: this.generateConditionalRules(fields),
      attachmentsRequired: this.getDefaultAttachments(),
      confidence: 0.82,
      parsedAt: new Date(),
    };
  }

  /**
   * Parse plain text or unstructured content
   */
  private parsePlainText(content: string): ParsedDocument {
    const fields: ParsedField[] = [];
    
    // Try to extract structured information from text
    const lines = content.split("\n");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 3) continue;
      
      // Look for label:value patterns
      const labelValueMatch = line.match(/^([A-Za-z][A-Za-z\s]*?):\s*(.+)$/);
      if (labelValueMatch) {
        const [, label, value] = labelValueMatch;
        const semanticType = this.classifyFieldByLabel(label);
        
        fields.push({
          id: `field_${i}`,
          originalLabel: label.trim(),
          semanticType,
          isMandatory: !label.toLowerCase().includes("optional"),
          currentValue: value.trim(),
          autoFillSource: "parsed_content",
          autoFillConfidence: 0.7,
          requiresHumanReview: this.requiresReview(semanticType),
          order: i,
        });
      }
    }

    // If no structured data found, use template
    if (fields.length === 0) {
      fields.push(...this.getTemplateFields());
      fields.push(...this.getLLMGeneratedFields(fields.length));
    }

    return {
      format: "plain_text",
      title: "Application Details",
      fields,
      conditionalLogic: [],
      attachmentsRequired: this.getDefaultAttachments(),
      confidence: 0.65,
      parsedAt: new Date(),
    };
  }

  /**
   * Classify field by its label using pattern matching
   */
  classifyFieldByLabel(label: string): SemanticFieldType {
    const lowerLabel = label.toLowerCase();
    
    for (const { pattern, type, confidence } of FIELD_TYPE_PATTERNS) {
      if (pattern.test(lowerLabel)) {
        return type;
      }
    }
    
    // Default classification based on keywords
    if (lowerLabel.includes("email") || lowerLabel.includes("contact")) return 'company_legal_name';
    if (lowerLabel.includes("phone") || lowerLabel.includes("tel")) return 'company_legal_name';
    if (lowerLabel.includes("description") || lowerLabel.includes("about")) return 'project_abstract';
    if (lowerLabel.includes("amount") || lowerLabel.includes("cost") || lowerLabel.includes("budget")) return 'funding_requested';
    
    return 'project_title'; // Default fallback
  }

  /**
   * Get standard grant application template fields
   */
  private getTemplateFields(): ParsedField[] {
    return [
      // Section 1: Organisation Details
      { id: "org_name", originalLabel: "Organisation Legal Name", semanticType: 'company_legal_name', isMandatory: true, requiresHumanReview: false, section: "Organisation Details", order: 1 },
      { id: "reg_number", originalLabel: "Company Registration Number", semanticType: 'registration_number', isMandatory: true, requiresHumanReview: false, section: "Organisation Details", order: 2 },
      { id: "reg_address", originalLabel: "Registered Address", semanticType: 'registered_address', isMandatory: true, requiresHumanReview: false, section: "Organisation Details", order: 3 },
      { id: "website", originalLabel: "Website URL", semanticType: 'company_website', isMandatory: false, requiresHumanReview: false, section: "Organisation Details", order: 4 },
      { id: "legal_struct", originalLabel: "Legal Structure", semanticType: 'legal_structure', isMandatory: true, options: [{label: "Limited Company", value: "ltd"}, {label: "Partnership", value: "partnership"}, {label: "Charity", value: "charity"}, {label: "University", value: "university"}], requiresHumanReview: false, section: "Organisation Details", order: 5 },
      { id: "sector", originalLabel: "Primary Sector", semanticType: 'sector', isMandatory: true, requiresHumanReview: false, section: "Organisation Details", order: 6 },
      { id: "employee_count", originalLabel: "Number of Employees", semanticType: 'employee_count', isMandatory: true, requiresHumanReview: false, section: "Organisation Details", order: 7 },
      { id: "annual_revenue", originalLabel: "Annual Revenue/Turnover (£)", semanticType: 'annual_revenue', isMandatory: true, requiresHumanReview: false, section: "Organisation Details", order: 8 },
      
      // Section 2: Project Details
      { id: "proj_title", originalLabel: "Project Title", semanticType: 'project_title', isMandatory: true, maxLength: 200, requiresHumanReview: false, section: "Project Details", order: 10 },
      { id: "proj_abstract", originalLabel: "Project Abstract/Summary", semanticType: 'project_abstract', isMandatory: true, maxLength: 5000, helpText: "Provide a concise overview of your project (max 5000 characters)", requiresHumanReview: true, section: "Project Details", order: 11 },
      { id: "start_date", originalLabel: "Project Start Date", semanticType: 'project_start_date', isMandatory: true, requiresHumanReview: false, section: "Project Details", order: 12 },
      { id: "end_date", originalLabel: "Project End Date", semanticType: 'project_end_date', isMandatory: true, requiresHumanReview: false, section: "Project Details", order: 13 },
      { id: "total_cost", originalLabel: "Total Project Cost (£)", semanticType: 'total_project_cost', isMandatory: true, requiresHumanReview: false, section: "Project Details", order: 14 },
      { id: "funding_req", originalLabel: "Funding Requested (£)", semanticType: 'funding_requested', isMandatory: true, requiresHumanReview: false, section: "Project Details", order: 15 },
      
      // Section 3: Team
      { id: "pi_name", originalLabel: "Principal Investigator Name", semanticType: 'principal_investigator', isMandatory: true, requiresHumanReview: false, section: "Team & Personnel", order: 20 },
      { id: "pi_bio", originalLabel: "Principal Investigator Biography", semanticType: 'team_member_bio', isMandatory: true, maxLength: 3000, requiresHumanReview: true, section: "Team & Personnel", order: 21 },
      { id: "key_personnel", originalLabel: "Key Personnel", semanticType: 'key_personnel', isMandatory: true, requiresHumanReview: true, section: "Team & Personnel", order: 22 },
      
      // Section 4: Financial
      { id: "budget", originalLabel: "Budget Breakdown", semanticType: 'budget_breakdown', isMandatory: true, requiresHumanReview: false, section: "Financial Information", order: 30 },
      { id: "cost_just", originalLabel: "Cost Justification", semanticType: 'cost_justification', isMandatory: true, maxLength: 5000, requiresHumanReview: true, section: "Financial Information", order: 31 },
      { id: "matching", originalLabel: "Matching Funding", semanticType: 'matching_funding', isMandatory: false, requiresHumanReview: false, section: "Financial Information", order: 32 },
      
      // Section 5: Declarations
      { id: "eligibility", originalLabel: "Eligibility Declaration", semanticType: 'eligibility_declaration', isMandatory: true, requiresHumanReview: false, section: "Declarations", order: 40 },
      { id: "state_aid", originalLabel: "State Aid Declaration", semanticType: 'state_aid_declaration', isMandatory: true, requiresHumanReview: false, section: "Declarations", order: 41 },
      { id: "conflict", originalLabel: "Conflict of Interest Declaration", semanticType: 'conflict_of_interest', isMandatory: true, requiresHumanReview: false, section: "Declarations", order: 42 },
      { id: "prev_funding", originalLabel: "Previous Funding Received", semanticType: 'previous_funding', isMandatory: true, requiresHumanReview: false, section: "Declarations", order: 43 },
    ];
  }

  /**
   * Get fields that should be generated by LLM
   */
  private getLLMGeneratedFields(startIndex: number): ParsedField[] {
    return [
      { id: "llm_impact", originalLabel: "Impact Statement", semanticType: 'impact_statement', isMandatory: true, maxLength: 8000, helpText: "Describe the expected impact of your project on society, economy, environment, etc.", requiresHumanReview: true, section: "Impact & Innovation", order: startIndex + 1 },
      { id: "llm_risk", originalLabel: "Risk Assessment", semanticType: 'risk_assessment', isMandatory: true, maxLength: 4000, helpText: "Identify key risks and your mitigation strategies", requiresHumanReview: true, section: "Impact & Innovation", order: startIndex + 2 },
      { id: "llm_innovation", originalLabel: "Innovation Description", semanticType: 'innovation_description', isMandatory: true, maxLength: 6000, helpText: "Explain what makes your project innovative/novel", requiresHumanReview: true, section: "Impact & Innovation", order: startIndex + 3 },
      { id: "llm_market", originalLabel: "Market Analysis", semanticType: 'market_analysis', isMandatory: true, maxLength: 4000, helpText: "Describe the market opportunity and target customers", requiresHumanReview: true, section: "Commercialisation", order: startIndex + 4 },
      { id: "llm_competitors", originalLabel: "Competitive Landscape", semanticType: 'competitor_analysis', isMandatory: true, maxLength: 3000, helpText: "Who are your competitors and what differentiates you?", requiresHumanReview: true, section: "Commercialisation", order: startIndex + 5 },
      { id: "llm_commercial", originalLabel: "Commercialisation Plan", semanticType: 'commercialisation_plan', isMandatory: true, maxLength: 5000, helpText: "How will you commercialise the results?", requiresHumanReview: true, section: "Commercialisation", order: startIndex + 6 },
      { id: "llm_vfm", originalLabel: "Value for Money Statement", semanticType: 'value_for_money', isMandatory: true, maxLength: 3000, helpText: "Demonstrate value for money for funders", requiresHumanReview: true, section: "Value for Money", order: startIndex + 7 },
      { id: "llm_public", originalLabel: "Public Engagement Plan", semanticType: 'public_engagement', isMandatory: false, maxLength: 2000, helpText: "How will you engage with the public?", requiresHumanReview: true, section: "Dissemination", order: startIndex + 8 },
    ];
  }

  /**
   * Get default attachment requirements
   */
  private getDefaultAttachments(): AttachmentRequirement[] {
    return [
      { id: "att_financial", label: "Financial Accounts", acceptedTypes: ["application/pdf"], maxSizeMB: 10, isMandatory: true, description: "Last 2 years of audited financial statements" },
      { id: "att_governance", label: "Governance Document", acceptedTypes: ["application/pdf"], maxSizeMB: 5, isMandatory: true, description: "Articles of association, trust deed, or equivalent" },
      { id: "att_org_chart", label: "Organisational Chart", acceptedTypes: ["application/pdf", "image/png", "image/jpeg"], maxSizeMB: 5, isMandatory: false },
      { id: "att_support_letters", label: "Letters of Support", acceptedTypes: ["application/pdf"], maxSizeMB: 10, isMandatory: false, description: "Maximum 3 letters of support from partners/stakeholders" },
      { id: "att_cv", label: "CVs of Key Personnel", acceptedTypes: ["application/pdf"], maxSizeMB: 15, isMandatory: true, description: "Combined PDF with all key personnel CVs" },
    ];
  }

  /**
   * Generate conditional logic rules
   */
  private generateConditionalRules(fields: ParsedField[]): ConditionalRule[] {
    const rules: ConditionalRule[] = [];
    
    // Example rules
    rules.push({
      id: "rule_1",
      fieldId: "legal_struct",
      condition: "equals",
      value: "charity",
      action: "show",
      targetFieldIds: ["charity_number"],
    });

    rules.push({
      id: "rule_2",
      fieldId: "total_cost",
      condition: "greater_than",
      value: 100000,
      action: "require",
      targetFieldIds: ["audit_accounts"],
    });

    return rules;
  }

  /**
   * Determine if a field type requires human review after auto-fill
   */
  private requiresReview(type: SemanticFieldType): boolean {
    const reviewRequiredTypes: SemanticFieldType[] = [
      'project_abstract',
      'impact_statement',
      'risk_assessment',
      'innovation_description',
      'market_analysis',
      'competitor_analysis',
      'commercialisation_plan',
      'value_for_money',
      'public_engagement',
      'team_member_bio',
      'cost_justification',
    ];
    
    return reviewRequiredTypes.includes(type);
  }

  /**
   * Get section name for field type
   */
  private getSectionForType(type: SemanticFieldType): string {
    if (['company_legal_name', 'registration_number', 'registered_address', 'company_website', 'incorporation_date', 'legal_structure', 'sector', 'sic_codes', 'employee_count', 'annual_revenue'].includes(type)) {
      return "Organisation Details";
    }
    if (['project_title', 'project_abstract', 'project_duration', 'project_start_date', 'project_end_date', 'total_project_cost', 'funding_requested'].includes(type)) {
      return "Project Details";
    }
    if (['team_member_name', 'team_member_role', 'team_member_bio', 'team_member_qualifications', 'principal_investigator', 'key_personnel'].includes(type)) {
      return "Team & Personnel";
    }
    if (['impact_statement', 'risk_assessment', 'innovation_description'].includes(type)) {
      return "Impact & Innovation";
    }
    if (['market_analysis', 'competitor_analysis', 'commercialisation_plan'].includes(type)) {
      return "Commercialisation";
    }
    if (['budget_breakdown', 'cost_justification', 'matching_funding', 'cash_contribution', 'in_kind_contribution'].includes(type)) {
      return "Financial Information";
    }
    if (['eligibility_declaration', 'state_aid_declaration', 'conflict_of_interest', 'previous_funding'].includes(type)) {
      return "Declarations";
    }
    return "Other";
  }

  /**
   * Format label from field name
   */
  private formatLabel(name: string): string {
    return name
      .replace(/[_-]/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }
}

// Singleton instance
export const universalParser = new UniversalDocumentParser();

// Export convenience function
export async function parseDocument(input: string | object, format?: DocumentFormat): Promise<ParsedDocument> {
  return universalParser.parseDocument(input, format);
}
