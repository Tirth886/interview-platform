import { useEffect, useState } from "react";
import {
  clearLiveScreenShareStream,
  getLiveScreenShareStream,
  setLiveScreenShareStream,
} from "../utils/liveMediaSession";

type UseInterviewRoomMediaParams = {
  canAccessRoom: boolean;
  selfVideoRef: React.RefObject<HTMLVideoElement>;
};

type InterviewRoomMedia = {
  cameraMicStream: MediaStream | null;
  screenStream: MediaStream | null;
  mediaError: string | null;
  isScreenOn: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  setMicEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setCameraEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  stopAllMedia: () => void;
};

export function useInterviewRoomMedia({
  canAccessRoom,
  selfVideoRef,
}: UseInterviewRoomMediaParams): InterviewRoomMedia {
  const [cameraMicStream, setCameraMicStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  useEffect(() => {
    if (!canAccessRoom) return;

    let mounted = true;

    const setup = async (): Promise<void> => {
      try {
        const av = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) {
          av.getTracks().forEach((t) => t.stop());
          return;
        }
        setCameraMicStream(av);

        const existing = getLiveScreenShareStream();
        if (existing) {
          setScreenStream(existing);
        }

        setMediaError(null);
      } catch {
        setMediaError("Camera or microphone permission was denied.");
      }
    };

    void setup();

    return () => {
      mounted = false;
    };
  }, [canAccessRoom]);

  useEffect(() => {
    if (selfVideoRef.current && cameraMicStream) {
      selfVideoRef.current.srcObject = cameraMicStream;
      void selfVideoRef.current.play();
    }
  }, [selfVideoRef, cameraMicStream]);

  useEffect(() => {
    if (cameraEnabled && selfVideoRef.current && selfVideoRef.current.paused && cameraMicStream) {
      selfVideoRef.current.srcObject = cameraMicStream;
      void selfVideoRef.current.play();
    }
  }, [selfVideoRef, cameraEnabled, cameraMicStream]);

  useEffect(() => {
    if (!cameraMicStream) return;
    cameraMicStream.getAudioTracks().forEach((track) => {
      track.enabled = micEnabled;
    });
  }, [micEnabled, cameraMicStream]);

  useEffect(() => {
    if (!cameraMicStream) return;
    cameraMicStream.getVideoTracks().forEach((track) => {
      track.enabled = cameraEnabled;
    });
  }, [cameraEnabled, cameraMicStream]);

  useEffect(() => {
    if (!screenStream) return;

    const track = screenStream.getVideoTracks()[0];
    if (!track) return;

    track.onended = () => {
      setScreenStream(null);
      setLiveScreenShareStream(null);
    };
  }, [screenStream]);

  useEffect(() => {
    return () => {
      if (cameraMicStream) cameraMicStream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraMicStream]);

  useEffect(() => {
    return () => {
      if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
      clearLiveScreenShareStream(false);
    };
  }, [screenStream]);

  const isScreenOn = Boolean(screenStream?.getVideoTracks().some((t) => t.readyState === "live"));

  const stopScreenShare = (): void => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    setScreenStream(null);
    setLiveScreenShareStream(null);
  };

  const startScreenShare = async (): Promise<void> => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setMediaError("Screen sharing is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });

      const track = stream.getVideoTracks()[0];
      const displaySurface = track?.getSettings().displaySurface;
      if (displaySurface && displaySurface !== "monitor") {
        stream.getTracks().forEach((t) => t.stop());
        setMediaError("Please share your entire screen (not a tab or window).");
        return;
      }

      if (track) {
        track.onended = () => {
          setScreenStream(null);
          setLiveScreenShareStream(null);
        };
      }

      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }

      setScreenStream(stream);
      setLiveScreenShareStream(stream);
      setMediaError(null);
    } catch {
      setMediaError("Screen sharing was not started. Please allow permission and try again.");
    }
  };

  const stopAllMedia = (): void => {
    if (cameraMicStream) cameraMicStream.getTracks().forEach((t) => t.stop());
    if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
    clearLiveScreenShareStream(false);
  };

  return {
    cameraMicStream,
    screenStream,
    mediaError,
    isScreenOn,
    micEnabled,
    cameraEnabled,
    setMicEnabled,
    setCameraEnabled,
    startScreenShare,
    stopScreenShare,
    stopAllMedia,
  };
}
