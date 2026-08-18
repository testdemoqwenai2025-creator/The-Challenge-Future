// POST /api/auto-fill/review
// Submit human review changes to auto-filled content

import { NextRequest, NextResponse } from "next/server";
import { autoFillEngine } from "@/lib/auto-fill/engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, reviewedFields } = body;

    // Validate required fields
    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 }
      );
    }

    if (!reviewedFields || !Array.isArray(reviewedFields)) {
      return NextResponse.json(
        { error: "reviewedFields array is required" },
        { status: 400 }
      );
    }

    // Validate each review item
    for (const item of reviewedFields) {
      if (!item.fieldId) {
        return NextResponse.json(
          { error: "Each reviewed field must have a fieldId" },
          { status: 400 }
        );
      }
    }

    console.log(`Processing review for application ${applicationId}, ${reviewedFields.length} fields`);

    const result = await autoFillEngine.submitReview(applicationId, reviewedFields);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process review",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
