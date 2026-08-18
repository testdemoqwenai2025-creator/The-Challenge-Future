// Submission Gateway
// Handles submission of completed applications via various methods

import {
  CompletedApplication,
  PortalConfig,
  SubmissionResult,
  ProofOfSubmission,
  FilePackage,
} from "./types";

class SubmissionGateway {
  
  /**
   * Submit application via the appropriate method
   */
  async submit(
    application: CompletedApplication,
    portalConfig: PortalConfig
  ): Promise<SubmissionResult> {
    switch (portalConfig.portalType) {
      case "api":
        return this.submitViaAPI(application, portalConfig);
      
      case "rpa":
        return this.submitViaRPA(application, portalConfig);
      
      case "file_upload":
        return this.prepareForFileUpload(application, portalConfig);
      
      case "manual":
        return this.prepareManualSubmission(application, portalConfig);
      
      default:
        return {
          success: false,
          timestamp: new Date(),
          method: "file_package",
          error: `Unsupported portal type: ${portalConfig.portalType}`,
          retryPossible: false,
        };
    }
  }

  /**
   * Submit via REST API
   */
  private async submitViaAPI(
    application: CompletedApplication,
    config: PortalConfig
  ): Promise<SubmissionResult> {
    try {
      if (!config.apiEndpoint || !config.authMethod) {
        throw new Error("Missing API configuration");
      }

      // Prepare request body
      const requestBody = this.prepareAPIPayload(application);

      // Get auth headers
      const headers = await this.getAuthHeaders(config);

      // Make submission request
      const response = await fetch(config.apiEndpoint!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Capture proof of submission
      const proof = await this.captureProofOfSubmission(config, result.submissionId || result.id);

      return {
        success: true,
        submissionId: result.submissionId || result.id,
        submissionReference: result.referenceNumber,
        timestamp: new Date(),
        method: "api",
        proofOfSubmission: proof,
        retryPossible: true,
      };

    } catch (error) {
      console.error("API submission error:", error);
      return {
        success: false,
        timestamp: new Date(),
        method: "api",
        error: String(error),
        retryPossible: true,
      };
    }
  }

  /**
   * Submit via RPA (browser automation)
   */
  private async submitViaRPA(
    application: CompletedApplication,
    config: PortalConfig
  ): Promise<SubmissionResult> {
    // RPA would be implemented with Playwright/Puppeteer in production
    // For now, return a placeholder indicating RPA would be used
    
    return {
      success: false,
      timestamp: new Date(),
      method: "rpa",
      error: "RPA submission requires server-side browser automation. Please use file upload or manual submission.",
      retryPossible: true,
      proofOfSubmission: {
        type: "reference_number",
        data: `RPA-QUEUED-${Date.now()}`,
        capturedAt: new Date(),
        verified: false,
      },
    };
  }

  /**
   * Prepare for file upload submission
   */
  private async prepareForFileUpload(
    application: CompletedApplication,
    _config: PortalConfig
  ): Promise<SubmissionResult> {
    try {
      const filePackage = await this.prepareFilePackage(application);

      return {
        success: true,
        submissionId: application.applicationId,
        timestamp: new Date(),
        method: "file_package",
        proofOfSubmission: {
          type: "receipt",
          data: JSON.stringify({
            packageId: filePackage.manifest.format,
            filesCount: filePackage.files.length,
            generatedAt: filePackage.manifest.generatedAt,
            checksum: "generated", // Would be real hash in production
          }),
          capturedAt: new Date(),
          verified: true,
        },
        retryPossible: true,
      };

    } catch (error) {
      console.error("File preparation error:", error);
      return {
        success: false,
        timestamp: new Date(),
        method: "file_package",
        error: String(error),
        retryPossible: true,
      };
    }
  }

  /**
   * Prepare for manual submission
   */
  private async prepareManualSubmission(
    application: CompletedApplication,
    _config: PortalConfig
  ): Promise<SubmissionResult> {
    const filePackage = await this.prepareFilePackage(application);

    return {
      success: true,
      submissionId: application.applicationId,
      timestamp: new Date(),
      method: "file_package",
      proofOfSubmission: {
        type: "reference_number",
        data: `MANUAL-${application.applicationId}-${Date.now()}`,
        capturedAt: new Date(),
        verified: true,
      },
      retryPossible: true,
    };
  }

  /**
   * Prepare complete file package for download
   */
  async prepareFilePackage(application: CompletedApplication): Promise<FilePackage> {
    const files: FilePackage["files"] = [];

    // Main form data as JSON
    files.push({
      filename: "form_data.json",
      content: JSON.stringify(application.formData, null, 2),
      mimeType: "application/json",
    });

    // Form data as human-readable document
    const readableForm = this.generateReadableForm(application.formData);
    files.push({
      filename: "application_form.txt",
      content: readableForm,
      mimeType: "text/plain",
    });

    // Attachments
    for (const attachment of application.attachments) {
      files.push({
        filename: attachment.filename,
        content: attachment.data.toString("base64"),
        mimeType: attachment.mimeType,
      });
    }

    // Submission manifest
    files.push({
      filename: "manifest.json",
      content: JSON.stringify({
        generatedAt: new Date().toISOString(),
        format: "NEXUS-Submission-Package",
        version: "1.0.0",
        applicationId: application.applicationId,
        grantProgrammeId: application.grantProgrammeId,
        files: files.map(f => ({
          filename: f.filename,
          mimeType: f.mimeType,
          size: f.content.length,
        })),
      }, null, 2),
      mimeType: "application/json",
    });

    return {
      applicationId: application.applicationId,
      files,
      manifest: {
        generatedAt: new Date(),
        format: "NEXUS-Submission-Package",
        version: "1.0.0",
      },
    };
  }

  /**
   * Generate human-readable form from data
   */
  private generateReadableForm(formData: Record<string, any>): string {
    let output = "";
    output += "=" .repeat(60) + "\n";
    output += "GRANT APPLICATION FORM\n";
    output += "Generated by NEXUS Ecosystem Intelligence Platform\n";
    output += `Generated: ${new Date().toISOString()}\n`;
    output += "=" .repeat(60) + "\n\n";

    const sections: Record<string, Array<{ label: string; value: string }>> = {};

    // Group fields by section
    for (const [fieldId, fieldData] of Object.entries(formData)) {
      const data = fieldData as any;
      const section = data.section || "Other";
      
      if (!sections[section]) {
        sections[section] = [];
      }
      
      sections[section].push({
        label: data.label || fieldId,
        value: data.value || "[Not provided]",
      });
    }

    // Output each section
    for (const [section, fields] of Object.entries(sections)) {
      output += "-".repeat(40) + "\n";
      output += `${section}\n`;
      output += "-".repeat(40) + "\n";

      for (const field of fields) {
        output += `\n${field.label}:\n`;
        output += `${field.value}\n`;
      }
      output += "\n";
    }

    output += "=" .repeat(60) + "\n";
    output += "END OF APPLICATION FORM\n";
    output += "=" .repeat(60) + "\n";

    return output;
  }

  /**
   * Prepare payload for API submission
   */
  private prepareAPIPayload(application: CompletedApplication): Record<string, any> {
    return {
      applicationId: application.applicationId,
      submittedAt: new Date().toISOString(),
      formData: application.formData,
      attachments: application.attachments.map(a => ({
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
      })),
      metadata: {
        platform: "NEXUS",
        version: "1.0.0",
        autoFillPercentage: this.calculateAutoFillPercent(application.formData),
      },
    };
  }

  /**
   * Calculate auto-fill percentage from form data
   */
  private calculateAutoFillPercent(formData: Record<string, any>): number {
    const fields = Object.values(formData);
    if (fields.length === 0) return 0;

    const filledFields = fields.filter((f: any) => 
      f.value && f.value.trim() && f.value !== "[Not provided]"
    ).length;

    return Math.round((filledFields / fields.length) * 100);
  }

  /**
   * Get authentication headers based on method
   */
  private async getAuthHeaders(config: PortalConfig): Promise<Record<string, string>> {
    switch (config.authMethod) {
      case "oauth2":
        // Would implement OAuth2 token retrieval
        return {
          Authorization: `Bearer ${config.credentials?.accessToken || ""}`,
        };

      case "api_key":
        return {
          "X-API-Key": config.credentials?.apiKey || "",
        };

      case "cookie":
        return {
          Cookie: config.credentials?.sessionCookie || "",
        };

      default:
        return {};
    }
  }

  /**
   * Capture proof of submission
   */
  async captureProofOfSubmission(
    _config: PortalConfig,
    submissionId: string
  ): Promise<ProofOfSubmission> {
    // In production, this would:
    // - Take screenshot of confirmation page (RPA)
    // - Download receipt PDF (API)
    // - Save email confirmation reference
    
    return {
      type: "reference_number",
      data: submissionId,
      capturedAt: new Date(),
      verified: true,
    };
  }

  /**
   * Get supported portal configurations
   */
  getSupportedPortals(): Array<{
    id: string;
    name: string;
    type: PortalConfig["portalType"];
    authMethods: PortalConfig["authMethod"][];
  }> {
    return [
      {
        id: "innovate_uk",
        name: "Innovate UK IFS",
        type: "file_upload",
        authMethods: ["cookie"],
      },
      {
        id: "eic_accelerator",
        name: "EIC Accelerator",
        type: "api",
        authMethods: ["oauth2"],
      },
      {
        id: "eu_ted",
        name: "EU TED Procurement",
        type: "rpa",
        authMethods: ["cookie"],
      },
      {
        id: "ukri_je_s",
        name: "UKRI Joint Electronic Submission",
        type: "file_upload",
        authMethods: ["cookie"],
      },
      {
        id: "nsf",
        name: "NSF (US)",
        type: "api",
        authMethods: ["api_key", "oauth2"],
      },
      {
        id: "generic_manual",
        name: "Generic Manual Submission",
        type: "manual",
        authMethods: [],
      },
    ];
  }

  /**
   * Validate application before submission
   */
  validateApplication(application: CompletedApplication): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields are filled
    const requiredFields = [
      "org_name",
      "reg_number",
      "proj_title",
      "proj_abstract",
      "total_cost",
      "funding_req",
    ];

    for (const fieldId of requiredFields) {
      const fieldData = application.formData[fieldId];
      if (!fieldData || !fieldData.value || !fieldData.value.trim()) {
        errors.push(`Required field ${fieldId} is empty`);
      }
    }

    // Check word limits on long-form fields
    const wordLimitFields = [
      { id: "proj_abstract", maxWords: 5000 },
      { id: "llm_impact", maxWords: 8000 },
      { id: "llm_risk", maxWords: 4000 },
    ];

    for (const { id, maxWords } of wordLimitFields) {
      const fieldData = application.formData[id];
      if (fieldData?.value) {
        const wordCount = fieldData.value.split(/\s+/).length;
        if (wordCount > maxWords) {
          warnings.push(`Field ${id} exceeds word limit (${wordCount}/${maxWords})`);
        }
      }
    }

    // Check attachments
    const requiredAttachments = ["att_financial", "att_cv"];
    for (const attId of requiredAttachments) {
      const hasAttachment = application.attachments.some(
        a => a.fieldId === attId
      );
      if (!hasAttachment) {
        warnings.push(`Required attachment ${attId} may be missing`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Singleton instance
export const submissionGateway = new SubmissionGateway();
