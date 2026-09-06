import { isPermissionGranted } from "@tauri-apps/plugin-notification";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { IndexHeader } from "./components/IndexHeader/IndexHeader";
import { IndexNotificationRequest } from "./components/IndexNotificationRequest";
import { IndexScore } from "./components/IndexScore";
import { IndexTasks } from "./components/IndexTasks/IndexTasks";
import { IndexTimer } from "./components/IndexTimer";
import { notificationPermissionAtom } from "./states/notification-permission";

export function IndexPage() {
  const [stateNotificationPermission, setStateNotificationPermission] = useAtom(
    notificationPermissionAtom,
  );
  const shouldBlockContent =
    stateNotificationPermission.permissionStatus !== "granted";
  const hasInitializedPermissionStatus =
    stateNotificationPermission.permissionStatus !== null;

  useEffect(() => {
    let isMounted = true;

    async function loadPermissionStatus() {
      try {
        const permissionGranted = await isPermissionGranted();
        if (!isMounted) {
          return;
        }

        setStateNotificationPermission((currentState) => ({
          ...currentState,
          permissionStatus: permissionGranted ? "granted" : "prompt",
        }));
      } catch {
        if (!isMounted) {
          return;
        }

        setStateNotificationPermission((currentState) => ({
          ...currentState,
          permissionStatus: "denied",
        }));
      }
    }

    loadPermissionStatus();

    return () => {
      isMounted = false;
    };
  }, [setStateNotificationPermission]);

  return (
    <div className="body-df min-h-screen flex flex-col">
      <div className="flex w-full flex-1 flex-col p-3 sm:p-4">
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full max-w-6xl flex-col gap-6">
            {/*
              IndexHeader stays mounted in this single spot for every permission
              state (only its `showOnlyLogo` prop changes) so it renders from the
              very first paint and never unmounts/remounts across the boot ->
              granted/denied transition — a remount here would reset
              useStoredWorkflows (which lives inside IndexHeader) and delay
              workflow hydration right after the permission check resolves.
            */}
            <IndexHeader showOnlyLogo={shouldBlockContent} />
            {hasInitializedPermissionStatus && !shouldBlockContent && (
              <div className="flex w-full flex-col lg:flex-row items-stretch gap-6">
                <IndexTimer />
                <IndexScore />
              </div>
            )}
            {hasInitializedPermissionStatus &&
              (shouldBlockContent ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
                  <IndexNotificationRequest />
                </div>
              ) : (
                <IndexTasks />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
