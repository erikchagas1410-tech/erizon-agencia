import "server-only";

export function logCreativeRenderEvent(
  event:
    | {
        stage: "generate";
        success: true;
        template: string;
        format: string;
        durationMs: number;
        briefingSummary: string;
      }
    | {
        stage: "generate";
        success: false;
        format: string;
        durationMs: number;
        briefingSummary: string;
        error: string;
      }
    | {
        stage: "serve";
        success: true;
        fileId: string;
        download: boolean;
      }
    | {
        stage: "serve";
        success: false;
        fileId: string;
        download: boolean;
        error: string;
      }
) {
  const payload = {
    timestamp: new Date().toISOString(),
    ...event
  };

  if (event.success) {
    console.info("[creative-render]", JSON.stringify(payload));
    return;
  }

  console.error("[creative-render]", JSON.stringify(payload));
}
