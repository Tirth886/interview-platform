import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";
import { useEffect, useRef, useState } from "react";
import { CompatibilityChecklist } from "./CompatibilityChecklist";
import type { CompatibilityCheck } from "../../../types/session";
import { setLiveScreenShareStream } from "../../../utils/liveMediaSession";

type StepPreparationProps = {
  checks: CompatibilityCheck[];
  requireScreenShareBeforeJoin: boolean;
  onJoinNow: () => void;
};

export const StepPreparation = ({
  checks,
  requireScreenShareBeforeJoin,
  onJoinNow,
}: StepPreparationProps): JSX.Element => {
  const [elapsed, setElapsed] = useState(0);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [sharedSurfaceLabel, setSharedSurfaceLabel] = useState<string>("");
  const [micVerified, setMicVerified] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speakerTestPlayed, setSpeakerTestPlayed] = useState(false);
  const [speakerVerified, setSpeakerVerified] = useState(false);
  const [speakerError, setSpeakerError] = useState<string | null>(null);
  const releaseMediaOnUnmount = useRef(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (releaseMediaOnUnmount.current && screenShareStream) {
        screenShareStream.getTracks().forEach((track) => track.stop());
        setLiveScreenShareStream(null);
      }
    };
  }, [screenShareStream]);

  const hasScreenShareApi = checks.find((check) => check.key === "screen_share_api")?.ok ?? false;
  const isScreenShareLive = Boolean(
    screenShareStream?.getVideoTracks().some((track) => track.readyState === "live")
  );
  const canJoin =
    (!requireScreenShareBeforeJoin || isScreenShareLive) &&
    micVerified &&
    speakerVerified;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Preparing Interview</CardTitle>
        <CardDescription>
          Final system checks are complete. You can join the interview now.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-foreground">Preparing secure interview room...</p>
          <div className="mt-3 h-2 overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.min(100, 20 + elapsed * 20)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Session setup in progress. You may join when ready.
          </p>
        </div>

        <CompatibilityChecklist checks={checks} title="Final Compatibility Check" />

        {requireScreenShareBeforeJoin && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-sm font-medium text-foreground">Mandatory Screen Share Check</p>
            <p className="text-xs text-muted-foreground">
              Candidate must share screen once before joining the interview.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                disabled={!hasScreenShareApi}
                onClick={async () => {
                  try {
                    if (!navigator.mediaDevices?.getDisplayMedia) {
                      setScreenShareError("Screen sharing is not supported in this browser.");
                      return;
                    }

                    const stream = await navigator.mediaDevices.getDisplayMedia({
                      video: true,
                      audio: false,
                    });

                    const track = stream.getVideoTracks()[0];
                    if (track) {
                      track.onended = () => {
                        setScreenShareStream(null);
                        setSharedSurfaceLabel("");
                        setScreenShareError("Screen sharing stopped. Start sharing again to join.");
                      };
                    }

                    if (screenShareStream) {
                      screenShareStream.getTracks().forEach((item) => item.stop());
                    }

                    setScreenShareStream(stream);
                    setLiveScreenShareStream(stream);
                    setSharedSurfaceLabel(track?.label ?? "Shared surface selected");
                    setScreenShareError(null);
                  } catch {
                    setScreenShareError("Screen share was not completed. Please try again.");
                  }
                }}
              >
                {isScreenShareLive ? "Screen Shared" : "Start Screen Share"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {isScreenShareLive ? "Verified" : "Pending"}
              </span>
            </div>
            {isScreenShareLive && sharedSurfaceLabel && (
              <p className="text-xs text-emerald-700">Sharing: {sharedSurfaceLabel}</p>
            )}
            {screenShareError && <p className="text-xs text-destructive">{screenShareError}</p>}
          </div>
        )}

        {
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-sm font-medium text-foreground">Mandatory Microphone Check</p>
            <p className="text-xs text-muted-foreground">
              Candidate microphone permission and input must be verified before join.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    const track = stream.getAudioTracks()[0];
                    const ok = Boolean(track && track.readyState === "live");
                    stream.getTracks().forEach((item) => item.stop());
                    setMicVerified(ok);
                    setMicError(ok ? null : "Microphone is not active. Please try again.");
                  } catch {
                    setMicVerified(false);
                    setMicError("Microphone permission denied or unavailable. Please enable microphone.");
                  }
                }}
              >
                {micVerified ? "Microphone Verified" : "Test Microphone"}
              </Button>
              <span className="text-xs text-muted-foreground">{micVerified ? "Verified" : "Pending"}</span>
            </div>
            {micError && <p className="text-xs text-destructive">{micError}</p>}
          </div>
        }

        {
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-sm font-medium text-foreground">Mandatory Speaker Test</p>
            <p className="text-xs text-muted-foreground">
              Play a short test tone and confirm you can hear it.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    const context = new AudioContext();
                    const oscillator = context.createOscillator();
                    const gain = context.createGain();
                    oscillator.type = "sine";
                    oscillator.frequency.value = 880;
                    gain.gain.value = 0.05;
                    oscillator.connect(gain);
                    gain.connect(context.destination);
                    oscillator.start();
                    window.setTimeout(() => {
                      oscillator.stop();
                      void context.close();
                    }, 700);
                    setSpeakerTestPlayed(true);
                    setSpeakerError(null);
                  } catch {
                    setSpeakerError("Unable to play speaker test tone on this device/browser.");
                  }
                }}
              >
                Play Test Sound
              </Button>
              <Button
                variant="outline"
                disabled={!speakerTestPlayed}
                onClick={() => {
                  setSpeakerVerified(true);
                  setSpeakerError(null);
                }}
              >
                I Heard It
              </Button>
              <span className="text-xs text-muted-foreground">{speakerVerified ? "Verified" : "Pending"}</span>
            </div>
            {speakerError && <p className="text-xs text-destructive">{speakerError}</p>}
          </div>
        }

        <Button
          disabled={!canJoin}
          onClick={() => {
            if (requireScreenShareBeforeJoin && !isScreenShareLive) {
              setScreenShareError("Active screen sharing is required before joining.");
              return;
            }
            releaseMediaOnUnmount.current = false;
            if (screenShareStream) {
              setLiveScreenShareStream(screenShareStream);
            }
            onJoinNow();
          }}
        >
          Join Now
        </Button>
      </CardContent>
    </Card>
  );
};
