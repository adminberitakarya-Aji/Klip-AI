import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@klipai/db/client";

// SSE endpoint for real-time progress: GET /api/templates/generations/[jobId]/stream
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  // Check if this is an SSE request
  const acceptHeader = request.headers.get("accept");
  if (acceptHeader !== "text/event-stream") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Expected Accept: text/event-stream",
        },
      },
      { status: 400 },
    );
  }

  const sessionUser = await getSessionUser(request);
  if (!sessionUser?.id) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 },
    );
  }

  const { jobId } = await params;

  const job = await prisma.templateGenerationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Generation job not found" },
      },
      { status: 404 },
    );
  }

  if (job.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Not authorized" },
      },
      { status: 403 },
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        if (isClosed) return;
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Initial state
      sendEvent("status", {
        status: job.status,
        progress: job.progress,
        currentShot: job.currentShot,
      });

      // Poll for updates
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        const updatedJob = await prisma.templateGenerationJob.findUnique({
          where: { id: jobId },
        });

        if (!updatedJob) {
          sendEvent("error", { message: "Job not found" });
          clearInterval(interval);
          controller.close();
          isClosed = true;
          return;
        }

        sendEvent("status", {
          status: updatedJob.status,
          progress: updatedJob.progress,
          currentShot: updatedJob.currentShot,
          shotResults: updatedJob.shotResults,
        });

        if (
          ["COMPLETED", "FAILED", "PARTIAL_SUCCESS"].includes(updatedJob.status)
        ) {
          if (updatedJob.stitchedVideoUrl) {
            sendEvent("completed", {
              stitchedVideoUrl: updatedJob.stitchedVideoUrl,
            });
          } else if (updatedJob.error) {
            sendEvent("failed", { error: updatedJob.error });
          }
          clearInterval(interval);
          controller.close();
          isClosed = true;
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        isClosed = true;
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
