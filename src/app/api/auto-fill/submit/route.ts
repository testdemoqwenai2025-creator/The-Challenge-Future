// POST /api/auto-fill/submit
// Final submission of completed application

import { NextRequest, NextResponse } from "next/server";
import { submissionGateway } from "@/lib/submission/gateway";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      applicationId, 
      portalType,
      portalConfig,
    } = body;

    // Validate required fields
    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 }
      );
    }

    // Get application from database
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: { grantProgramme: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    console.log(`Processing submission for application ${applicationId}`);

    // Prepare completed application object
    const completedApplication = {
      applicationId: application.id,
      grantProgrammeId: application.grantProgrammeId || "",
      formData: (application.data as Record<string, any>) || {},
      attachments: [], // Would be populated from attachment storage
      submittedAt: new Date(),
    };

    // Determine portal configuration
    const config = portalConfig || {
      portalType: portalType || "manual",
      authMethod: undefined,
    };

    // Validate before submission
    const validation = submissionGateway.validateApplication(completedApplication);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        validation,
      }, { status: 400 });
    }

    // Submit
    const result = await submissionGateway.submit(completedApplication, config);

    // Update application status in database
    if (result.success) {
      await db.application.update({
        where: { id: applicationId },
        data: {
          status: "submitted",
          submittedAt: new Date(),
          submittedVia: result.method,
          proofOfSubmission: result.submissionReference || result.proofOfSubmission?.data,
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      data: {
        ...result,
        validation,
      },
    });

  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { 
        error: "Failed to submit application",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

// GET /api/auto-fill/submit - Get supported portals
export async function GET() {
  const portals = submissionGateway.getSupportedPortals();

  return NextResponse.json({
    success: true,
    data: {
      portals,
      submissionMethods: [
        {
          type: "api",
          name: "Direct API",
          description: "Submit directly to funder's API",
          requires: ["API endpoint", "Authentication credentials"],
        },
        {
          type: "rpa",
          name: "Browser Automation",
          description: "Automated form filling via browser",
          requires: ["Portal URL", "Login credentials"],
        },
        {
          type: "file_upload",
          name: "File Package Download",
          description: "Download complete package for manual upload",
          requires: [],
        },
        {
          type: "manual",
          name: "Manual Submission Guide",
          description: "Step-by-step instructions for manual submission",
          requires: [],
        },
      ],
    },
  });
}
