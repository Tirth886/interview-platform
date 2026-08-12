import { MonitorUp } from "lucide-react";

type RoomTopBarProps = {
  title?: string;
  jobTitle?: string;
  mediaError: string | null;
  isScreenOn: boolean;
};

export function RoomTopBar({ title, jobTitle, mediaError, isScreenOn }: RoomTopBarProps): JSX.Element {
  return (
    <div className="flex shrink-0 items-center justify-between px-5 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-slate-400">{jobTitle}</p>
      </div>
      {mediaError && (
        <p className="rounded-full bg-rose-600/30 px-3 py-1 text-xs text-rose-300">{mediaError}</p>
      )}
      <div className="flex items-center gap-2">
        {isScreenOn && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-800/50 px-3 py-1 text-xs text-emerald-300">
            <MonitorUp className="h-3.5 w-3.5" />
            Sharing screen
          </span>
        )}
      </div>
    </div>
  );
}
