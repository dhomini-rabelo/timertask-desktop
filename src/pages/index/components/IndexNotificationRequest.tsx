import { requestPermission } from "@tauri-apps/plugin-notification";
import { useAtom } from "jotai";
import { BellOff } from "lucide-react";
import { Box } from "../../../layout/components/atoms/Box";
import { notificationPermissionAtom } from "../states/notification-permission";

export function IndexNotificationRequest() {
  const [stateNotificationPermission, setStateNotificationPermission] = useAtom(
    notificationPermissionAtom,
  );
  const isPermissionDenied =
    stateNotificationPermission.permissionStatus === "denied";

  function normalizePermissionStatus(permission: NotificationPermission) {
    return permission === "default" ? "prompt" : permission;
  }

  async function handleRequestPermission() {
    setStateNotificationPermission((currentState) => ({
      ...currentState,
      isRequestingPermission: true,
    }));

    try {
      const permissionStatus = await requestPermission();
      setStateNotificationPermission((currentState) => ({
        ...currentState,
        permissionStatus: normalizePermissionStatus(permissionStatus),
        isRequestingPermission: false,
      }));
    } catch {
      setStateNotificationPermission((currentState) => ({
        ...currentState,
        permissionStatus: "denied",
        isRequestingPermission: false,
      }));
    }
  }

  return (
    <Box className="w-full max-w-xl p-8 flex flex-col items-center gap-5 text-center">
      <div className="h-14 w-14 rounded-full bg-Blue-500/10 text-Blue-500 flex items-center justify-center">
        <BellOff size={30} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-semibold text-Black-700 dark:text-White">
          Allow notifications
        </p>
        <p className="text-sm text-Black-400">
          We need your permission to send task reminders and track time in real
          time.
        </p>
      </div>
      <button
        onClick={handleRequestPermission}
        disabled={stateNotificationPermission.isRequestingPermission}
        className="px-5 py-3 rounded-full bg-Blue-500 text-White font-semibold hover:bg-Blue-400 transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-Blue-600 dark:hover:bg-Blue-500"
      >
        {stateNotificationPermission.isRequestingPermission
          ? "Requesting permission..."
          : "Allow notifications"}
      </button>
      {isPermissionDenied ? (
        <p className="text-xs text-Red-500">
          Permission denied in the browser. Enable notifications in your
          settings to continue.
        </p>
      ) : null}
    </Box>
  );
}
