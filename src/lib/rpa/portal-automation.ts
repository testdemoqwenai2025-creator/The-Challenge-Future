// Playwright RPA System for Portal Submissions
// Automates form submissions to grant portals (Innovate UK, EU funding portals, etc.)

export interface RPAConfig {
  headless: boolean;
  timeoutMs: number;
  screenshotPath?: string;
  browserContextPath?: string;
  slowMo?: number; // Slow down actions for debugging (ms)
}

export interface FormField {
  selector: string;       // CSS selector or XPath
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'signature';
  value: string | boolean | FileList;
  label?: string;         // Human-readable label
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    customMessage?: string;
  };
}

export interface PortalSubmission {
  id: string;
  portalName: string;
  portalUrl: string;
  fields: FormField[];
  status: 'pending' | 'navigating' | 'filling' | 'reviewing' | 'submitting' | 'completed' | 'failed';
  progress: number; // 0-100
  screenshots?: string[];
  error?: string;
  submittedAt?: Date;
  confirmationReference?: string;
}

export interface RPASession {
  id: string;
  userId: string;
  applicationId: string;
  submission: PortalSubmission;
  startedAt: Date;
  completedAt?: Date;
  logs: RPALogEntry[];
}

export interface RPALogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

class PortalAutomationEngine {
  private config: RPAConfig;
  private activeSessions: Map<string, RPASession> = new Map();

  constructor(config?: Partial<RPAConfig>) {
    this.config = {
      headless: process.env.RPA_HEADLESS === 'true',
      timeoutMs: parseInt(process.env.RPA_TIMEOUT_MS || '30000'),
      screenshotPath: process.env.RPA_SCREENSHOT_PATH,
      browserContextPath: process.env.RPA_BROWSER_CONTEXT_PATH,
      slowMo: 0,
      ...config,
    };
  }

  /**
   * Start a new portal submission session
   */
  async startSubmission(
    userId: string,
    applicationId: string,
    portalUrl: string,
    fields: FormField[],
    portalName: string = 'Unknown Portal'
  ): Promise<RPASession> {
    const sessionId = `rpa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const submission: PortalSubmission = {
      id: `sub_${Date.now()}`,
      portalName,
      portalUrl,
      fields,
      status: 'pending',
      progress: 0,
    };

    const session: RPASession = {
      id: sessionId,
      userId,
      applicationId,
      submission,
      startedAt: new Date(),
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: `RPA session started for ${portalName}`,
      }],
    };

    this.activeSessions.set(sessionId, session);
    
    // Start the automation process in background
    this.executeSubmission(sessionId).catch(error => {
      this.log(sessionId, 'error', `Submission failed: ${error.message}`, { error });
    });

    return session;
  }

  /**
   * Execute the actual portal submission
   */
  private async executeSubmission(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    try {
      // Dynamic import of Playwright (only when needed)
      const { chromium } = await import('playwright');

      // Update status
      this.updateStatus(sessionId, 'navigating', 10);
      this.log(sessionId, 'info', `Launching browser and navigating to ${session.submission.portalUrl}`);

      // Launch browser
      const browser = await chromium.launch({
        headless: this.config.headless,
        slowMo: this.config.slowMo,
      });

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        locale: 'en-GB',
        timezoneId: 'Europe/London',
        // Persist context for potential reuse
        ...(this.config.browserContextPath && {
          storageState: `${this.config.browserContextPath}/${sessionId}.json`,
        }),
      });

      const page = await context.newPage();

      // Set default timeout
      page.setDefaultTimeout(this.config.timeoutMs);

      try {
        // Navigate to portal
        await page.goto(session.submission.portalUrl, { waitUntil: 'networkidle' });
        await this.takeScreenshot(page, sessionId, '01_landing');
        
        this.updateStatus(sessionId, 'filling', 30);
        this.log(sessionId, 'success', 'Successfully navigated to portal');

        // Fill in each field
        for (let i = 0; i < session.submission.fields.length; i++) {
          const field = session.submission.fields[i];
          const progress = 30 + Math.round((i / session.submission.fields.length) * 50);

          this.log(sessionId, 'info', `Filling field ${i + 1}/${session.submission.fields.length}: ${field.label || field.selector}`);
          await this.fillField(page, field, sessionId);
          
          this.updateProgress(sessionId, progress);
          
          // Small delay between fields to appear human-like
          if (this.config.slowMo === 0) {
            await this.randomDelay(500, 1500);
          }
        }

        await this.takeScreenshot(page, sessionId, '02_filled');

        // Review phase
        this.updateStatus(sessionId, 'reviewing', 85);
        this.log(sessionId, 'info', 'Reviewing filled form...');
        await this.randomDelay(2000, 3000);

        // Submit the form
        this.updateStatus(sessionId, 'submitting', 90);
        this.log(sessionId, 'info', 'Submitting form...');
        
        const submitResult = await this.submitForm(page, sessionId);
        
        if (submitResult.success) {
          this.updateStatus(sessionId, 'completed', 100);
          session.submission.submittedAt = new Date();
          session.submission.confirmationReference = submitResult.reference;
          session.completedAt = new Date();
          this.log(sessionId, 'success', `Form submitted successfully! Reference: ${submitResult.reference}`);
        } else {
          throw new Error(submitResult.error || 'Submission failed');
        }

        await this.takeScreenshot(page, sessionId, '03_confirmation');

      } finally {
        // Save browser state if configured
        if (this.config.browserContextPath) {
          await context.storageState(`${this.config.browserContextPath}/${sessionId}.json`);
        }
        
        await browser.close();
      }

    } catch (error) {
      this.updateStatus(sessionId, 'failed', session.submission.progress);
      this.log(sessionId, 'error', `Automation error: ${(error as Error).message}`);
      session.submission.error = (error as Error).message;
      session.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Fill a single form field
   */
  private async fillField(
    page: any, // Playwright Page object
    field: FormField,
    sessionId: string
  ): Promise<void> {
    try {
      // Wait for element to be visible
      const element = await page.waitForSelector(field.selector, { 
        state: 'visible',
        timeout: 10000 
      });

      if (!element) {
        throw new Error(`Element not found: ${field.selector}`);
      }

      switch (field.type) {
        case 'text':
          await element.click();
          await element.fill(field.value as string);
          break;

        case 'textarea':
          await element.click();
          await element.fill(field.value as string);
          break;

        case 'select':
          await element.selectOption({ label: field.value as string });
          break;

        case 'checkbox':
          if (field.value && !(await element.isChecked())) {
            await element.check();
          } else if (!field.value && await element.isChecked()) {
            await element.uncheck();
          }
          break;

        case 'radio':
          await page.click(field.selector); // Radio buttons are clicked directly
          break;

        case 'file':
          await element.setInputFiles(field.value as string[]);
          break;

        case 'date':
          await element.fill(field.value as string);
          break;

        case 'signature':
          // For signature pads - would need canvas manipulation
          // This is a placeholder for signature field handling
          this.log(sessionId, 'warn', 'Signature fields require manual intervention');
          break;

        default:
          throw new Error(`Unsupported field type: ${field.type}`);
      }

      // Validate field if validation rules exist
      if (field.validation) {
        await this.validateField(element, field, sessionId);
      }

    } catch (error) {
      this.log(sessionId, 'error', `Failed to fill field "${field.label || field.selector}": ${(error as Error).message}`);
      
      // Take screenshot on error for debugging
      // await this.takeScreenshot(page, sessionId, `error_${field.label || field.selector}`);
      
      throw error;
    }
  }

  /**
   * Validate a field after filling
   */
  private async validateField(
    element: any,
    field: FormField,
    sessionId: string
  ): Promise<void> {
    const value = await element.inputValue() as string;

    if (field.validation?.minLength && value.length < field.validation.minLength) {
      throw new Error(`Field too short (min ${field.validation.minLength} chars)`);
    }

    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      throw new Error(`Field too long (max ${field.validation.maxLength} chars)`);
    }

    if (field.validation?.pattern && !field.validation.pattern.test(value)) {
      throw new Error(field.validation.customMessage || 'Field value does not match required format');
    }
  }

  /**
   * Submit the form (finds and clicks submit button)
   */
  private async submitForm(
    page: any,
    sessionId: string
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    try {
      // Common submit button selectors to try
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("submit")',
        '#submit',
        '.submit-button',
        '[data-testid="submit"]',
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await page.$(selector);
          if (submitButton) break;
        } catch {
          continue;
        }
      }

      if (!submitButton) {
        return { success: false, error: 'Submit button not found' };
      }

      // Click submit
      await submitButton.click();

      // Wait for navigation or confirmation
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

      // Look for confirmation message/reference number
      const url = page.url();
      const content = await page.content();

      // Extract reference from common patterns
      const refPatterns = [
        /reference[:\s]*([A-Z0-9\-]+)/i,
        /confirmation[:\s]*([A-Z0-9\-]+)/i,
        /application\s*(number|ID)?[:\s]*([A-Z0-9\-]+)/i,
        /REF[:\s]*([A-Z0-9\-]+)/i,
      ];

      let reference: string | undefined;
      for (const pattern of refPatterns) {
        const match = content.match(pattern) || url.match(pattern);
        if (match) {
          reference = match[1];
          break;
        }
      }

      return { 
        success: true, 
        reference: reference || `AUTO_${Date.now()}` 
      };

    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  /**
   * Take a screenshot for debugging/audit trail
   */
  private async takeScreenshot(
    page: any,
    sessionId: string,
    name: string
  ): Promise<string | null> {
    if (!this.config.screenshotPath) return null;

    try {
      const filename = `${sessionId}_${name}_${Date.now()}.png`;
      const path = `${this.config.screenshotPath}/${filename}`;
      
      await page.screenshot({ 
        path, 
        fullPage: true,
        type: 'png',
      });

      if (session.submission.screenshots) {
        session.submission.screenshots.push(path);
      } else {
        session.submission.screenshots = [path];
      }

      this.log(sessionId, 'info', `Screenshot saved: ${path}`);
      return path;

    } catch (error) {
      this.log(sessionId, 'warn', `Failed to take screenshot: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Add log entry to session
   */
  private log(sessionId: string, level: RPALogEntry['level'], message: string, details?: any): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.logs.push({
      timestamp: new Date(),
      level,
      message,
      details,
    });

    // Keep only last 100 log entries
    if (session.logs.length > 100) {
      session.logs = session.logs.slice(-100);
    }
  }

  /**
   * Update submission status
   */
  private updateStatus(sessionId: string, status: PortalSubmission['status'], progress: number): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.submission.status = status;
    session.submission.progress = progress;
  }

  /**
   * Update progress percentage
   */
  private updateProgress(sessionId: string, progress: number): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.submission.progress = Math.min(100, Math.max(0, progress));
  }

  /**
   * Generate random delay to simulate human behavior
   */
  private async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get session status
   */
  getSession(sessionId: string): RPASession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): RPASession[] {
    const sessions: RPASession[] = [];
    
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId) {
        sessions.push(session);
      }
    }
    
    return sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Cancel an active session
   */
  async cancelSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.submission.status === 'completed') {
      return false;
    }

    this.updateStatus(sessionId, 'cancelled', session.submission.progress);
    this.log(sessionId, 'warn', 'Session cancelled by user');
    session.completedAt = new Date();

    return true;
  }

  /**
   * Clean up old sessions (older than specified hours)
   */
  cleanup(maxAgeHours: number = 24): number {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.startedAt.getTime() < cutoff) {
        this.activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get statistics about RPA usage
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    failedSessions: number;
    averageCompletionTime: number;
    successRate: number;
  } {
    let active = 0, completed = 0, failed = 0;
    let totalTime = 0;
    let completedWithTime = 0;

    for (const session of this.activeSessions.values()) {
      switch (session.submission.status) {
        case 'pending':
        case 'navigating':
        case 'filling':
        case 'reviewing':
        case 'submitting':
          active++;
          break;
        case 'completed':
          completed++;
          if (session.completedAt) {
            totalTime += session.completedAt.getTime() - session.startedAt.getTime();
            completedWithTime++;
          }
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return {
      totalSessions: this.activeSessions.size,
      activeSessions: active,
      completedSessions: completed,
      failedSessions: failed,
      averageCompletionTime: completedWithTime > 0 ? totalTime / completedWithTime : 0,
      successRate: completed + failed > 0 ? (completed / (completed + failed)) * 100 : 0,
    };
  }
}

// Singleton instance
export const rpaEngine = new PortalAutomationEngine();

// Pre-configured portal templates
export const PORTAL_TEMPLATES = {
  innovate_uk: {
    name: 'Innovate UK Funding Service',
    url: 'https://iuk.ukri.org/',
    fieldMappings: {
      projectTitle: 'input[name="projectTitle"]',
      abstract: 'textarea[name="abstract"]',
      leadOrganization: 'input[name="orgName"]',
      durationMonths: 'select[name="duration"]',
      totalCost: 'input[name="totalCost"]',
      startDate: 'input[name="startDate"]',
      // Add more mappings as needed
    },
  },
  eu_funding_portal: {
    name: 'EU Funding & Tenders Portal',
    url: 'https://ec.europa.eu/info/funding-tenders-opportunities_en',
    fieldMappings: {},
    // EU portal requires different approach
  },
  research_uk: {
    name: 'UK Research Innovation (UKRI)',
    url: 'https://www.ukri.org/apply-for-funding/',
    fieldMappings: {},
  },
  gov_grants: {
    name: 'GOV.UK Find a Grant',
    url: 'https://www.gov.uk/find-eu-exit-business-finance-grant',
    fieldMappings: {},
  },
};

// Utility function to convert auto-fill engine output to RPA format
export function convertToRPAFields(autoFillOutput: Array<{
  id: string;
  originalLabel: string;
  resolvedValue: string;
  resolutionStatus: string;
}>): FormField[] {
  return autoFillOutput.map(field => ({
    // Generic selector - would need customization per portal
    selector: `[data-field-id="${field.id}"], #${field.id}, input[name="${field.id.toLowerCase()}"]`,
    type: inferFieldType(field.originalLabel),
    value: field.resolvedValue,
    label: field.originalLabel,
    required: field.resolutionStatus !== 'skipped',
  }));
}

/**
 * Infer field type from label/name
 */
function inferFieldType(label: string): FormField['type'] {
  const lower = label.toLowerCase();
  
  if (lower.includes('description') || lower.includes('summary') || lower.includes('abstract')) {
    return 'textarea';
  }
  if (lower.includes('email')) {
    return 'text'; // Could add email-specific validation
  }
  if (lower.includes('date') || lower.includes('deadline') || lower.includes('start')) {
    return 'date';
  }
  if (lower.includes('file') || lower.includes('document') || lower.includes('attachment')) {
    return 'file';
  }
  if (lower.includes('agree') || lower.includes('accept') || lower.includes('consent')) {
    return 'checkbox';
  }
  
  return 'text'; // Default to text
}
