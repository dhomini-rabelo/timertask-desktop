import { atom } from "jotai";

export type NotificationPermissionStatus = "granted" | "denied" | "prompt";

interface NotificationPermissionState {
  permissionStatus: NotificationPermissionStatus | null;
  isRequestingPermission: boolean;
}

export const notificationPermissionAtom = atom<NotificationPermissionState>({
  permissionStatus: null,
  isRequestingPermission: false,
});
