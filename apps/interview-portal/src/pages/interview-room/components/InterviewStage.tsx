import { MicOff } from "lucide-react";
import { cn } from "@shared/ui";
import React from "react";

type InterviewStageProps = {
  aiInterviewerName?: string;
  profileName: string;
  selfVideoRef: React.RefObject<HTMLVideoElement>;
  cameraEnabled: boolean;
  micEnabled: boolean;
  cameraMicStream: MediaStream | null;
};

export function InterviewStage({
  aiInterviewerName,
  profileName,
  selfVideoRef,
  cameraEnabled,
  micEnabled,
  cameraMicStream,
}: InterviewStageProps): JSX.Element {
  const showSelfVideo = cameraEnabled && Boolean(cameraMicStream);

  return (
    <div className="relative mx-3 mb-3 flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[#2d2f31]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-28 w-28 select-none items-center justify-center rounded-full bg-[#4a5568] text-4xl font-bold text-white shadow-2xl">
          AI
        </div>
        <div className="text-center">
          <p className="text-base font-semibold">AI Interviewer</p>
          <p className="mt-1 text-xs text-slate-400">{aiInterviewerName} · Speaking</p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-emerald-400"
              style={{
                height: `${8 + (i % 3) * 6}px`,
                animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 rounded-md bg-black/50 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
        AI Interviewer
      </div>

      <div
        className="absolute bottom-4 right-4 overflow-hidden rounded-xl border-2 border-white/10 shadow-xl"
        style={{ width: 180, height: 120 }}
      >
        <video
          ref={selfVideoRef}
          className={cn("h-full w-full object-cover", !showSelfVideo && "invisible")}
          autoPlay
          muted
          playsInline
        />

        {!showSelfVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#3c4043]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5f6368] text-sm font-semibold">
              {profileName.charAt(0).toUpperCase()}
            </div>
            <p className="text-[10px] font-medium text-white/70">{profileName}</p>
          </div>
        )}

        {showSelfVideo && (
          <div className="absolute bottom-1.5 left-2 text-[10px] font-medium text-white/80 drop-shadow">
            {profileName} (You)
          </div>
        )}

        {!micEnabled && (
          <div className="absolute right-1.5 bottom-1.5 rounded-full bg-black/70 p-1">
            <MicOff className="h-3 w-3 text-rose-400" />
          </div>
        )}
      </div>
    </div>
  );
}
