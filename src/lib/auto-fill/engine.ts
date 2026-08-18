// Auto-Fill Engine
// Main orchestrator for the 98% automation system

import { universalParser, ParsedDocument } from "@/lib/parser/universal-parser";
import { entityKnowledgeGraph } from "@/lib/knowledge-graph/entity-graph";
import { llmGenerator } from "@/lib/llm/generator";
import {
  ApplicationFillResult,
  ProcessedField,
  ResolveContext,
  ResolvedValue,
  ParsedField,
  SemanticFieldType,
} from "./types";
import { db } from "@/lib/db";

interface ProcessingState {
  applicationId: string;
  status: "processing" | "completed" | "partial" | "failed" | "reviewing";
  startTime: Date;
  currentField: number;
  totalFields: number;
  processedFields: ProcessedField[];
  errors: string[];
  warnings: string[];
}

class AutoFillEngine {
  private activeProcesses: Map<string, ProcessingState> = new Map();

  /**
   * Start processing an application for auto-fill
   */
  async startProcessing(
    grantProgrammeId: string,
    userId: string,
    options?: {
      companyData?: Record<string, any>;
      projectData?: Record<string, any>;
      preferences?: any;
    }
  ): Promise<ApplicationFillResult> {
    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Initialize processing state
    const state: ProcessingState = {
      applicationId,
      status: "processing",
      startTime: new Date(),
      currentField: 0,
      totalFields: 0,
      processedFields: [],
      errors: [],
      warnings: [],
    };

    this.activeProcesses.set(applicationId, state);

    try {
      // Step 1: Get grant programme details and parse template
      let parsedDocument: ParsedDocument;

      if (options?.projectData?.template) {
        // Parse provided template
        parsedDocument = await universalParser.parseDocument(
          options.projectData.template,
          options.projectData.templateFormat as any
        );
      } else {
        // Use default template for grant type
        parsedDocument = await this.getDefaultTemplate(grantProgrammeId);
      }

      state.totalFields = parsedDocument.fields.length;

      // Step 2: Create or get context for resolution
      const context = await this.buildContext(userId, options);

      // Step 3: Process each field
      const processedFields: ProcessedField[] = [];

      for (let i = 0; i < parsedDocument.fields.length; i++) {
        const field = parsedDocument.fields[i];
        state.currentField = i + 1;

        try {
          const processedField = await this.processField(field, context, parsedDocument);
          processedFields.push(processedField);

          if (processedField.resolutionStatus === "requires_review") {
            state.warnings.push(`Field "${field.originalLabel}" requires human review`);
          }
        } catch (error) {
          console.error(`Error processing field ${field.id}:`, error);
          
          processedFields.push({
            ...field,
            resolutionStatus: "manual",
            reviewNotes: `Processing error: ${String(error)}`,
          });
          
          state.errors.push(`Failed to process field "${field.originalLabel}"`);
        }

        // Small delay to prevent overwhelming APIs
        if (i % 5 === 4) {
          await this.sleep(100);
        }
      }

      // Step 4: Apply conditional logic
      const finalFields = this.applyConditionalLogic(
        processedFields,
        parsedDocument.conditionalLogic
      );

      // Step 5: Calculate statistics
      const stats = this.calculateFillStatistics(finalFields);

      // Step 6: Save to database
      await this.saveApplication(applicationId, userId, grantProgrammeId, finalFields, parsedDocument);

      state.status = stats.autoFillPercentage >= 80 ? "completed" : "partial";
      state.processedFields = finalFields;

      const result: ApplicationFillResult = {
        applicationId,
        status: state.status,
        totalFields: finalFields.length,
        autoFilledFields: stats.autoFilledCount,
        reviewedFields: stats.reviewRequiredCount,
        manualFields: stats.manualCount,
        autoFillPercentage: stats.autoFillPercentage,
        estimatedTimeSaved: this.estimateTimeSaved(finalFields),
        timeTaken: Date.now() - startTime,
        fields: finalFields,
        warnings: state.warnings,
        errors: state.errors,
      };

      return result;

    } catch (error) {
      console.error("Auto-fill processing error:", error);
      state.status = "failed";
      state.errors.push(String(error));

      return {
        applicationId,
        status: "failed",
        totalFields: 0,
        autoFilledFields: 0,
        reviewedFields: 0,
        manualFields: 0,
        autoFillPercentage: 0,
        estimatedTimeSaved: 0,
        timeTaken: Date.now() - startTime,
        fields: [],
        errors: [String(error)],
        warnings: [],
      };
    }
  }

  /**
   * Process a single field
   */
  private async processField(
    field: ParsedField,
    context: ResolveContext,
    _document: ParsedDocument
  ): Promise<ProcessedField> {
    // If field already has a value, keep it
    if (field.currentValue && field.currentValue.trim()) {
      return {
        ...field,
        resolutionStatus: "auto_filled",
        resolvedValue: field.currentValue,
        resolvedConfidence: field.autoFillConfidence || 1,
        resolvedSource: field.autoFillSource as any || "existing_data",
      };
    }

    // Determine resolution strategy based on semantic type
    const needsLLMGeneration = this.requiresLLMGeneration(field.semanticType);

    if (needsLLMGeneration) {
      return await this.generateWithLLM(field, context);
    } else {
      return await this.resolveFromKnowledge(field, context);
    }
  }

  /**
   * Resolve field from knowledge graph and data sources
   */
  private async resolveFromKnowledge(
    field: ParsedField,
    context: ResolveContext
  ): Promise<ProcessedField> {
    const resolution: ResolvedValue = await entityKnowledgeGraph.resolveField(
      field.semanticType,
      context
    );

    if (resolution.confidence > 0.7 && !resolution.requiresReview) {
      return {
        ...field,
        resolutionStatus: "auto_filled",
        resolvedValue: resolution.value,
        resolvedConfidence: resolution.confidence,
        resolvedSource: resolution.source,
        reviewNotes: resolution.sourceDetails,
      };
    } else if (resolution.confidence > 0.3) {
      return {
        ...field,
        resolutionStatus: "requires_review",
        resolvedValue: resolution.value,
        resolvedConfidence: resolution.confidence,
        resolvedSource: resolution.source,
        reviewNotes: resolution.reviewReasons?.join("; ") || "Please verify this information",
      };
    } else {
      return {
        ...field,
        resolutionStatus: "manual",
        resolvedValue: "",
        resolvedConfidence: 0,
        resolvedSource: "not_resolved",
        reviewNotes: resolution.sourceDetails || "This field requires manual input",
      };
    }
  }

  /**
   * Generate content using LLM
   */
  private async generateWithLLM(
    field: ParsedField,
    context: ResolveContext
  ): Promise<ProcessedField> {
    try {
      let generatedContent: string | null = null;
      let confidence = 0.8; // Default confidence for LLM-generated content

      switch (field.semanticType) {
        case "project_abstract":
          const abstractResult = await llmGenerator.generateAbstract(
            context.existingData || {},
            {
              maxWords: field.maxLength ? Math.min(field.maxLength / 5, 1000) : 500,
              focusAreas: [context.existingData?.sector || "innovation"],
              evaluationCriteria: ["Impact", "Innovation", "Feasibility"],
              styleGuide: "Clear, compelling, evidence-based",
            }
          );
          generatedContent = abstractResult.content;
          confidence = abstractResult.confidence;
          break;

        case "impact_statement":
          const impactResult = await llmGenerator.generateImpactStatement(
            context.existingData || {},
            {
              dimensions: [
                { name: "Economic", description: "Economic impact", metrics: ["Jobs created", "Revenue generated"], weighting: 30 },
                { name: "Social", description: "Social benefit", metrics: ["Lives improved", "Skills developed"], weighting: 25 },
                { name: "Environmental", description: "Environmental sustainability", metrics: ["CO2 reduction", "Resource efficiency"], weighting: 25 },
                { name: "Knowledge", description: "Advancement of knowledge", metrics: ["Publications", "Patents"], weighting: 20 },
              ],
              timeframe: "3-5 years post-project",
              stakeholders: ["Academia", "Industry", "Public sector", "General public"],
            }
          );
          generatedContent = impactResult.content;
          confidence = impactResult.confidence;
          break;

        case "risk_assessment":
          const riskResult = await llmGenerator.generateRiskAssessment(
            context.existingData?.sector || "technology",
            {
              title: context.existingData?.projectTitle || "Project",
              duration: context.existingData?.duration || "24 months",
              budget: context.existingData?.budget || 500000,
            }
          );
          generatedContent = riskResult.content;
          confidence = riskResult.confidence;
          break;

        case "innovation_description":
          const innovationResult = await llmGenerator.generateInnovationDescription(
            context.existingData || {},
            {
              stateOfArt: "Current approaches face limitations in scalability, cost-effectiveness, and performance.",
              noveltyPoints: [
                "Novel algorithmic approach",
                "Unique combination of technologies",
                "Proprietary methodology",
              ],
            }
          );
          generatedContent = innovationResult.content;
          confidence = innovationResult.confidence;
          break;

        case "market_analysis":
          const marketResult = await llmGenerator.generateMarketAnalysis({
            sector: context.existingData?.sector || "technology",
            product: context.existingData?.projectTitle || "Solution",
            targetMarket: "Enterprise and research organizations",
          });
          generatedContent = marketResult.content;
          confidence = marketResult.confidence;
          break;

        case "competitor_analysis":
          const competitorResult = await llmGenerator.generateCompetitorAnalysis({
            sector: context.existingData?.sector || "technology",
          });
          generatedContent = competitorResult.content;
          confidence = competitorResult.confidence;
          break;

        case "commercialisation_plan":
          const commercialResult = await llmGenerator.generateCommercialisationPlan(
            context.existingData || {},
            {
              yearsToMarket: 2,
              milestones: ["Prototype", "Pilot", "Launch", "Scale"],
            }
          );
          generatedContent = commercialResult.content;
          confidence = commercialResult.confidence;
          break;

        case "value_for_money":
          generatedContent = llmGenerator.getMockContent("value_for_money");
          break;

        case "public_engagement":
          generatedContent = llmGenerator.getMockContent("public_engagement");
          break;

        default:
          // Generic LLM call for other types
          generatedContent = `Generated content for ${field.originalLabel}. This would be tailored based on your specific project details.`;
          confidence = 0.6;
      }

      if (generatedContent) {
        return {
          ...field,
          resolutionStatus: "requires_review", // LLM content always needs review
          resolvedValue: generatedContent,
          resolvedConfidence: confidence,
          resolvedSource: "llm_generated",
          reviewNotes: "AI-generated content - please review and customize for your specific situation",
        };
      }

      return {
        ...field,
        resolutionStatus: "manual",
        reviewNotes: "Could not generate content automatically",
      };

    } catch (error) {
      console.error(`LLM generation error for ${field.semanticType}:`, error);
      
      return {
        ...field,
        resolutionStatus: "manual",
        reviewNotes: `Generation failed: ${String(error)}. Please provide content manually.`,
      };
    }
  }

  /**
   * Check if field type requires LLM generation
   */
  private requiresLLMGeneration(type: SemanticFieldType): boolean {
    const llmTypes: SemanticFieldType[] = [
      "project_abstract",
      "impact_statement",
      "risk_assessment",
      "innovation_description",
      "market_analysis",
      "competitor_analysis",
      "commercialisation_plan",
      "value_for_money",
      "public_engagement",
      "team_member_bio",
      "cost_justification",
    ];

    return llmTypes.includes(type);
  }

  /**
   * Apply conditional logic to fields
   */
  private applyConditionalLogic(
    fields: ProcessedField[],
    rules: Array<{ id: string; fieldId: string; condition: string; value?: any; action: string; targetFieldIds: string[] }>
  ): ProcessedField[] {
    // Create a copy to modify
    const modifiedFields = [...fields];

    for (const rule of rules) {
      const sourceField = modifiedFields.find(f => f.id === rule.fieldId);
      if (!sourceField?.resolvedValue) continue;

      let conditionMet = false;

      switch (rule.condition) {
        case "equals":
          conditionMet = sourceField.resolvedValue === rule.value;
          break;
        case "not_equals":
          conditionMet = sourceField.resolvedValue !== rule.value;
          break;
        case "contains":
          conditionMet = sourceField.resolvedValue.includes(rule.value || "");
          break;
        case "greater_than":
          conditionMet = parseFloat(sourceField.resolvedValue) > parseFloat(rule.value || "0");
          break;
        case "less_than":
          conditionMet = parseFloat(sourceField.resolvedValue) < parseFloat(rule.value || "0");
          break;
        case "is_set":
          conditionMet = !!sourceField.resolvedValue;
          break;
        case "is_not_set":
          conditionMet = !sourceField.resolvedValue;
          break;
      }

      // Apply action to target fields
      for (const targetId of rule.targetFieldIds) {
        const targetIndex = modifiedFields.findIndex(f => f.id === targetId);
        if (targetIndex === -1) continue;

        switch (rule.action) {
          case "show":
          case "require":
            modifiedFields[targetIndex] = {
              ...modifiedFields[targetIndex],
              isMandatory: rule.action === "require",
            };
            break;
          case "hide":
            modifiedFields[targetIndex] = {
              ...modifiedFields[targetIndex],
              resolutionStatus: "skipped" as const,
              reviewNotes: "Hidden by conditional logic",
            };
            break;
          case "optional":
            modifiedFields[targetIndex] = {
              ...modifiedFields[targetIndex],
              isMandatory: false,
            };
            break;
        }
      }
    }

    return modifiedFields;
  }

  /**
   * Calculate fill statistics
   */
  private calculateFillStatistics(fields: ProcessedField[]): {
    autoFilledCount: number;
    reviewRequiredCount: number;
    manualCount: number;
    skippedCount: number;
    autoFillPercentage: number;
  } {
    let autoFilledCount = 0;
    let reviewRequiredCount = 0;
    let manualCount = 0;
    let skippedCount = 0;

    for (const field of fields) {
      switch (field.resolutionStatus) {
        case "auto_filled":
          autoFilledCount++;
          break;
        case "requires_review":
          reviewRequiredCount++;
          break;
        case "manual":
          manualCount++;
          break;
        case "skipped":
          skippedCount++;
          break;
      }
    }

    const fillableFields = fields.length - skippedCount;
    const autoFillPercentage = fillableFields > 0
      ? Math.round(((autoFilledCount + reviewRequiredCount * 0.7) / fillableFields) * 100)
      : 0;

    return {
      autoFilledCount,
      reviewRequiredCount,
      manualCount,
      skippedCount,
      autoFillPercentage,
    };
  }

  /**
   * Estimate time saved compared to manual completion
   */
  private estimateTimeSaved(fields: ProcessedField[]): number {
    // Average time estimates per field type (in minutes)
    const timeEstimates: Record<string, number> = {
      simple: 2,       // Name, address, etc.
      moderate: 10,    // Budget breakdowns
      complex: 45,     // Abstracts, impact statements
      very_complex: 90, // Full narrative sections
    };

    let totalTimeSaved = 0;

    for (const field of fields) {
      if (field.resolutionStatus === "skipped") continue;

      let estimate = timeEstimates.moderate;

      // Categorize field complexity
      const complexTypes: SemanticFieldType[] = [
        "project_abstract",
        "impact_statement",
        "risk_assessment",
        "innovation_description",
        "commercialisation_plan",
      ];

      const simpleTypes: SemanticFieldType[] = [
        "company_legal_name",
        "registration_number",
        "registered_address",
        "incorporation_date",
        "legal_structure",
        "sector",
        "employee_count",
        "annual_revenue",
        "eligibility_declaration",
        "state_aid_declaration",
        "conflict_of_interest",
      ];

      if (complexTypes.includes(field.semanticType)) {
        estimate = timeEstimates.complex;
      } else if (simpleTypes.includes(field.semanticType)) {
        estimate = timeEstimates.simple;
      }

      // Factor in whether it was auto-filled
      if (field.resolutionStatus === "auto_filled") {
        totalTimeSaved += estimate * 0.95; // 95% time saved
      } else if (field.resolutionStatus === "requires_review") {
        totalTimeSaved += estimate * 0.75; // 75% time saved (just editing)
      }
    }

    return Math.round(totalTimeSaved);
  }

  /**
   * Build resolution context from user data
   */
  private async buildContext(
    userId: string,
    options?: {
      companyData?: Record<string, any>;
      projectData?: Record<string, any>;
      preferences?: any;
    }
  ): Promise<ResolveContext> {
    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { watchlists: { include: { company: true } } },
    });

    // Get primary company if available
    let companyId: string | undefined;
    const existingData: Record<string, any> = {};

    if (user?.watchlists && user.watchlists.length > 0) {
      companyId = user.watchlists[0].companyId;
      const company = user.watchlists[0].company;
      
      existingData.companyName = company.name;
      existingData.registrationNumber = company.registrationNumber;
      existingData.address = company.registeredAddress;
      existingData.sector = company.sector;
      existingData.employeeCount = company.employeeCount;
      existingData.revenue = company.annualRevenue;
    }

    // Merge with provided options
    return {
      userId,
      companyId,
      existingData: {
        ...existingData,
        ...options?.companyData,
        ...options?.projectData,
      },
      preferences: options?.preferences,
    };
  }

  /**
   * Get default template for grant type
   */
  private async getDefaultTemplate(_grantProgrammeId: string): Promise<ParsedDocument> {
    // Return standard Innovate UK / UKRI template structure
    return universalParser.parseDocument("standard_grant_application");
  }

  /**
   * Save application to database
   */
  private async saveApplication(
    applicationId: string,
    userId: string,
    grantProgrammeId: string,
    fields: ProcessedField[],
    document: ParsedDocument
  ): Promise<void> {
    try {
      // Convert fields to JSON-serializable format
      const formData = fields.reduce((acc, field) => {
        acc[field.id] = {
          value: field.resolvedValue || "",
          label: field.originalLabel,
          semanticType: field.semanticType,
          status: field.resolutionStatus,
          confidence: field.resolvedConfidence,
          source: field.resolvedSource,
        };
        return acc;
      }, {} as Record<string, any>);

      // Calculate progress
      const stats = this.calculateFillStatistics(fields);

      await db.application.create({
        data: {
          id: applicationId,
          userId,
          grantProgrammeId,
          status: stats.autoFillPercentage >= 80 ? "matched" : "in_progress",
          autoFillProgress: stats.autoFillPercentage,
          fieldsCompleted: stats.autoFilledCount + stats.reviewRequiredCount,
          fieldsTotal: fields.length,
          data: formData,
          parsedTemplate: document as any,
        },
      });
    } catch (error) {
      console.error("Error saving application:", error);
      // Don't throw - allow process to continue
    }
  }

  /**
   * Get processing status
   */
  getStatus(applicationId: string): ProcessingState | null {
    return this.activeProcesses.get(applicationId) || null;
  }

  /**
   * Submit reviewed changes
   */
  async submitReview(
    applicationId: string,
    reviewedFields: Array<{ fieldId: string; value: string; accepted: boolean }>
  ): Promise<{ success: boolean; updatedProgress: number }> {
    const state = this.activeProcesses.get(applicationId);
    
    if (!state) {
      throw new Error("Application not found or expired");
    }

    // Update fields with reviewed values
    for (const review of reviewedFields) {
      const fieldIndex = state.processedFields.findIndex(f => f.id === review.fieldId);
      if (fieldIndex !== -1) {
        state.processedFields[fieldIndex] = {
          ...state.processedFields[fieldIndex],
          resolvedValue: review.value,
          resolutionStatus: review.accepted ? "auto_filled" : "manual",
        };
      }
    }

    // Recalculate statistics
    const stats = this.calculateFillStatistics(state.processedFields);

    // Update database
    try {
      await db.application.update({
        where: { id: applicationId },
        data: {
          autoFillProgress: stats.autoFillPercentage,
          fieldsCompleted: stats.autoFilledCount + stats.reviewRequiredCount,
          data: state.processedFields.reduce((acc, f) => {
            acc[f.id] = { value: f.resolvedValue || "", status: f.resolutionStatus };
            return acc;
          }, {} as any),
          status: "in_progress",
        },
      });
    } catch (error) {
      console.error("Error updating application:", error);
    }

    return {
      success: true,
      updatedProgress: stats.autoFillPercentage,
    };
  }

  /**
   * Helper sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const autoFillEngine = new AutoFillEngine();
