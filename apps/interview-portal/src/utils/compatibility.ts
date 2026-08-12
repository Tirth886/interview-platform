import type { CompatibilityCheck } from "../types/session";

export const runCompatibilityChecks = async (): Promise<CompatibilityCheck[]> => {
  const checks: CompatibilityCheck[] = [];

  const browserSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator;

  checks.push({
    key: "browser_supported",
    label: "Browser Support",
    ok: browserSupported,
    detail: browserSupported
      ? "Browser APIs are available."
      : "Browser lacks required media APIs.",
  });

  const secureContext =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.hostname === "localhost");

  checks.push({
    key: "secure_context",
    label: "Secure Context",
    ok: secureContext,
    detail: secureContext
      ? "Secure context confirmed."
      : "Camera access requires HTTPS or localhost.",
  });

  const online = typeof navigator !== "undefined" ? navigator.onLine : false;
  checks.push({
    key: "online",
    label: "Network",
    ok: online,
    detail: online ? "Internet connection detected." : "No internet connection detected.",
  });

  const hasGetUserMedia =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  checks.push({
    key: "media_devices",
    label: "Camera Device",
    ok: hasGetUserMedia,
    detail: hasGetUserMedia
      ? "Camera API is available."
      : "Camera API is unavailable in this environment.",
  });

  const hasDisplayMedia =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

  checks.push({
    key: "screen_share_api",
    label: "Screen Share Support",
    ok: hasDisplayMedia,
    detail: hasDisplayMedia
      ? "Screen sharing API is available."
      : "Screen sharing is unavailable in this browser/environment.",
  });

  let permissionOk = true;
  let permissionDetail = "Camera permission check passed.";

  try {
    if (
      typeof navigator !== "undefined" &&
      "permissions" in navigator &&
      typeof navigator.permissions.query === "function"
    ) {
      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      permissionOk = result.state !== "denied";
      permissionDetail =
        result.state === "denied"
          ? "Camera permission denied. Please allow camera access."
          : "Camera permission is ready.";
    }
  } catch {
    permissionOk = true;
    permissionDetail = "Permission API not supported, permission will be requested on camera start.";
  }

  checks.push({
    key: "camera_permission",
    label: "Camera Permission",
    ok: permissionOk,
    detail: permissionDetail,
  });

  return checks;
};
