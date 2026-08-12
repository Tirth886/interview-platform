import { MonitorUp } from "lucide-react";

type ScreenSharePromptProps = {
  onStartScreenShare: () => void;
};

export function ScreenSharePrompt({ onStartScreenShare }: ScreenSharePromptProps): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-amber-400/40 bg-[#1f1a0f]/90 p-4 shadow-xl backdrop-blur">
        <p className="text-sm font-semibold text-amber-200">Screen Share Required In Interview Room</p>
        <p className="mt-1 text-xs text-amber-100/80">
          Please start screen sharing to continue the interview.
        </p>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-black hover:bg-amber-400"
          onClick={onStartScreenShare}
        >
          <MonitorUp className="h-3.5 w-3.5" /> Start Screen Share
        </button>
      </div>
    </div>
  );
}
