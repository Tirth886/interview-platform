import { cn } from "@shared/ui";
import React from "react";

type ControlButtonProps = {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  title: string;
  children: React.ReactNode;
};

export function ControlButton({
  onClick,
  active,
  danger,
  title,
  children,
}: ControlButtonProps): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        danger
          ? "bg-rose-600 hover:bg-rose-700 text-white"
          : active
          ? "bg-[#3c4043] hover:bg-[#4a5055] text-white"
          : "bg-[#3c4043]/60 hover:bg-[#3c4043] text-slate-400",
      )}
    >
      {children}
    </button>
  );
}
