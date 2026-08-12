import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@shared/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { CompatibilityChecklist } from "./CompatibilityChecklist";
import type { CompatibilityCheck } from "../../../types/session";

type StepIdentityVerificationProps = {
  existingCapture: string | null;
  checks: CompatibilityCheck[];
  onCapture: (dataUrl: string) => void;
  onContinue: () => void;
};

export const StepIdentityVerification = ({
  existingCapture,
  checks,
  onCapture,
  onContinue,
}: StepIdentityVerificationProps): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const hasBlockingIssue = useMemo(() => checks.some((check) => !check.ok), [checks]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    const startCamera = async (): Promise<void> => {
      if (hasBlockingIssue) {
        setCameraError("Resolve compatibility blockers to access camera.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (!mounted || !videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setCameraError(null);
      } catch {
        setCameraError("Unable to access camera. Please allow camera permissions and try again.");
      }
    };

    void startCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [hasBlockingIssue]);

  const canContinue = Boolean(existingCapture);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Identity Proof Verification</CardTitle>
        <CardDescription>
          Hold your identity document in front of the camera and capture a clear frame.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CompatibilityChecklist checks={checks} />

        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <div className="overflow-hidden rounded-lg border border-border bg-black">
            <video ref={videoRef} className="h-[260px] w-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Captured Preview</p>
            <div className="flex h-[180px] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
              {existingCapture ? (
                <img src={existingCapture} alt="Captured identity" className="h-full w-full object-cover" />
              ) : (
                <p className="px-4 text-center text-xs text-muted-foreground">No capture yet</p>
              )}
            </div>

            {cameraError && <p className="text-xs text-destructive">{cameraError}</p>}
            {!cameraError && !cameraReady && (
              <p className="text-xs text-muted-foreground">Preparing camera...</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!cameraReady || hasBlockingIssue}
                onClick={() => {
                  if (!videoRef.current || !canvasRef.current) {
                    return;
                  }

                  const width = videoRef.current.videoWidth || 640;
                  const height = videoRef.current.videoHeight || 360;
                  canvasRef.current.width = width;
                  canvasRef.current.height = height;
                  const ctx = canvasRef.current.getContext("2d");
                  if (!ctx) {
                    return;
                  }
                  ctx.drawImage(videoRef.current, 0, 0, width, height);
                  const dataUrl = canvasRef.current.toDataURL("image/png");
                  onCapture(dataUrl);
                }}
              >
                Capture
              </Button>
              <Button
                className={cn(!canContinue && "opacity-80")}
                disabled={!canContinue}
                onClick={onContinue}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
