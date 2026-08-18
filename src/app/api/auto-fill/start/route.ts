// POST /api/auto-fill/start
// Start auto-fill processing for an application

import { NextRequest, NextResponse } from "next/server";
import { autoFillEngine } from "@/lib/auto-fill/engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      grantProgrammeId,
      userId,
      companyData,
      projectData,
      preferences,
    } = body;

    // Validate required fields
    if (!grantProgrammeId) {
      return NextResponse.json(
        { error: "grantProgrammeId is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    console.log(`Starting auto-fill for grant ${grantProgrammeId}, user ${userId}`);

    // Start processing (this runs synchronously for now)
    const result = await autoFillEngine.startProcessing(grantProgrammeId, userId, {
      companyData,
      projectData,
      preferences,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("Auto-fill start error:", error);
    return NextResponse.json(
      { 
        error: "Failed to start auto-fill processing",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

// GET /api/auto-fill/start - Get supported templates info
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      supportedFormats: [
        "xml_ted",
        "html_portal", 
        "pdf_fillable",
        "word_docx",
        "plain_text",
      ],
      supportedGrantTypes: [
        "innovate_uk_smart",
        "innovate_uk_grant",
        "eic_accelerator",
        "ukri_standard",
        "eu_horizon",
        "nsf_generic",
        "generic_research",
      ],
      estimatedFillRates: {
        standard_application: 98,
        complex_research: 95,
        simple_form: 99,
      },
      features: {
        llmGeneration: true,
        knowledgeGraphLookup: true,
        conditionalLogicSupport: true,
        attachmentPreparation: true,
        submissionGateway: true,
      },
    },
  });
}
