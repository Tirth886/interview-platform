import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CodeWorkspace } from "./components/CodeWorkspace";
import { InterviewStage } from "./components/InterviewStage";
import { RoomControlBar } from "./components/RoomControlBar";
import { RoomTopBar } from "./components/RoomTopBar";
import { ScreenSharePrompt } from "./components/ScreenSharePrompt";
import { useInterviewRoomMedia } from "../../hooks/useInterviewRoomMedia";
import {
  joinInterviewSession,
  validateSessionAccess,
} from "../../services/sessionValidation";
import { useInterviewSessionStore } from "../../stores/useInterviewSessionStore";

export default function InterviewRoomPage(): JSX.Element {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const selfVideoRef = useRef<HTMLVideoElement | null>(null);

  const { activeSession, activeRole, activeUser, profile, joined, resetAll, setValidatedSession, markJoined } = useInterviewSessionStore(
    (state) => state,
  );

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      if (!sessionId) {
        setBootError('Missing interview session id.');
        setIsBootstrapping(false);
        return;
      }

      if (activeSession?.id === sessionId && (joined || activeSession.status === 'in-progress')) {
        setIsBootstrapping(false);
        return;
      }

      const validation = await validateSessionAccess({
        sessionId,
        role: 'candidate',
        user: activeUser,
      });

      if (cancelled) {
        return;
      }

      if (!validation.ok) {
        setBootError(validation.message);
        setIsBootstrapping(false);
        return;
      }

      if (validation.session.status !== 'in-progress') {
        navigate(`/session/${sessionId}`);
        return;
      }

      const joinResult = await joinInterviewSession({
        sessionId,
        role: validation.role,
        user: validation.user,
      });

      if (cancelled) {
        return;
      }

      if (!joinResult.ok) {
        setBootError(joinResult.message);
        setIsBootstrapping(false);
        return;
      }

      setValidatedSession(joinResult.session, joinResult.role, joinResult.user);
      markJoined();
      setIsBootstrapping(false);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [activeSession, activeUser, joined, markJoined, navigate, sessionId, setValidatedSession]);

  const canAccessRoom = useMemo(
    () =>
      Boolean(
        sessionId &&
          activeSession &&
          activeSession.id === sessionId &&
          (joined || activeSession.status === "in-progress") &&
          activeRole === "candidate",
      ),
    [activeRole, activeSession, joined, sessionId],
  );

  const {
    cameraMicStream,
    mediaError,
    isScreenOn,
    micEnabled,
    cameraEnabled,
    setMicEnabled,
    setCameraEnabled,
    startScreenShare,
    stopScreenShare,
    stopAllMedia,
  } = useInterviewRoomMedia({
    canAccessRoom,
    selfVideoRef,
  });

  const handleLeave = (): void => {
    stopAllMedia();
    resetAll();
    navigate("/");
  };

  const handleToggleScreenShare = (): void => {
    if (isScreenOn) {
      stopScreenShare();
      return;
    }
    void startScreenShare();
  };

  if (isBootstrapping) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Checking interview access...
        </div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <div className="rounded-lg border border-border bg-white p-6">
          <h1 className="text-xl font-semibold">Interview Access Error</h1>
          <p className="mt-2 text-sm text-muted-foreground">{bootError}</p>
          {sessionId && (
            <Link
              to={`/session/${sessionId}`}
              className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Back to Pre-Boarding
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!canAccessRoom) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#202124] px-4 text-white">
        <p className="text-lg font-medium">Interview room not ready.</p>
        <p className="text-sm text-slate-400">Complete pre-boarding before entering the room.</p>
        {sessionId && (
          <Link
            to={`/session/${sessionId}`}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
          >
            Back to Pre-Boarding
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#202124] text-white">
      <RoomTopBar
        title={activeSession?.title}
        jobTitle={activeSession?.jobTitle}
        mediaError={mediaError}
        isScreenOn={isScreenOn}
      />

      <InterviewStage
        aiInterviewerName={activeSession?.aiInterviewerName}
        profileName={profile.name}
        selfVideoRef={selfVideoRef}
        cameraEnabled={cameraEnabled}
        micEnabled={micEnabled}
        cameraMicStream={cameraMicStream}
      />

      <RoomControlBar
        micEnabled={micEnabled}
        cameraEnabled={cameraEnabled}
        isScreenOn={isScreenOn}
        isEditorOpen={isEditorOpen}
        onToggleMic={() => setMicEnabled((prev) => !prev)}
        onToggleCamera={() => setCameraEnabled((prev) => !prev)}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleEditor={() => setIsEditorOpen((prev) => !prev)}
        onLeave={handleLeave}
      />

      <CodeWorkspace
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />

      {!isScreenOn && !isEditorOpen && (
        <ScreenSharePrompt
          onStartScreenShare={() => {
            void startScreenShare();
          }}
        />
      )}
    </div>
  );
}
