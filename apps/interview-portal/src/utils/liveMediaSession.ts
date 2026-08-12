let liveScreenShareStream: MediaStream | null = null;

export const setLiveScreenShareStream = (stream: MediaStream | null): void => {
  liveScreenShareStream = stream;
};

export const getLiveScreenShareStream = (): MediaStream | null => {
  return liveScreenShareStream;
};

export const clearLiveScreenShareStream = (stopTracks = true): void => {
  if (stopTracks && liveScreenShareStream) {
    liveScreenShareStream.getTracks().forEach((track) => track.stop());
  }
  liveScreenShareStream = null;
};
