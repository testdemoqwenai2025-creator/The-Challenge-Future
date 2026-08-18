// GET /api/auto-fill/status/[id]
// Check auto-fill processing status

import { NextRequest, NextResponse } from "next/server";
import { autoFillEngine } from "@/lib/auto-fill/engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const status = autoFillEngine.getStatus(id);

    if (!status) {
      return NextResponse.json(
        { error: "Application not found or session expired" },
        { status: 404 }
      );
    }

    // Calculate progress percentage
    const progress = status.totalFields > 0
      ? Math.round((status.currentField / status.totalFields) * 100)
      : 0;

    // Get summary of processed fields
    const fieldSummary = {
      autoFilled: status.processedFields.filter(f => f.resolutionStatus === "auto_filled").length,
      requiresReview: status.processedFields.filter(f => f.resolutionStatus === "requires_review").length,
      manual: status.processedFields.filter(f => f.resolutionStatus === "manual").length,
      skipped: status.processedFields.filter(f => f.resolutionStatus === "skipped").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        applicationId: status.applicationId,
        status: status.status,
        progress,
        currentField: status.currentField,
        totalFields: status.totalFields,
        fieldSummary,
        errors: status.errors,
        warnings: status.warnings,
        elapsedMs: Date.now() - status.startTime.getTime(),
        estimatedRemainingMs: progress > 0 && progress < 100
          ? Math.round(((Date.now() - status.startTime.getTime()) / progress) * (100 - progress))
          : null,
        fields: status.processedFields, // Include full field data for review
      },
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to get status", details: String(error) },
      { status: 500 }
    );
  }
}
