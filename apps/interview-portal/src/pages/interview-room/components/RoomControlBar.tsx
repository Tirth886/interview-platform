import { Mic, MicOff, MonitorUp, PhoneOff, SquareTerminal, Video, VideoOff } from "lucide-react";
import { ControlButton } from "./ControlButton";

type RoomControlBarProps = {
  micEnabled: boolean;
  cameraEnabled: boolean;
  isScreenOn: boolean;
  isEditorOpen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleEditor: () => void;
  onLeave: () => void;
};

export function RoomControlBar({
  micEnabled,
  cameraEnabled,
  isScreenOn,
  isEditorOpen,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleEditor,
  onLeave,
}: RoomControlBarProps): JSX.Element {
  return (
    <div className="shrink-0 flex items-center justify-center gap-3 pb-6 pt-2">
      <ControlButton
        title={micEnabled ? "Mute microphone" : "Unmute microphone"}
        active={micEnabled}
        onClick={onToggleMic}
      >
        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </ControlButton>

      <ControlButton
        title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        onClick={onToggleCamera}
        active={cameraEnabled}
      >
        {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </ControlButton>

      <ControlButton
        title={isScreenOn ? "Stop screen share" : "Start screen share"}
        active={isScreenOn}
        onClick={onToggleScreenShare}
      >
        <MonitorUp className="h-5 w-5" />
      </ControlButton>

      <ControlButton
        title={isEditorOpen ? "Close code editor" : "Open code editor"}
        active={isEditorOpen}
        onClick={onToggleEditor}
      >
        <SquareTerminal className="h-5 w-5" />
      </ControlButton>

      <ControlButton title="Leave interview" danger onClick={onLeave}>
        <PhoneOff className="h-5 w-5" />
      </ControlButton>
    </div>
  );
}
