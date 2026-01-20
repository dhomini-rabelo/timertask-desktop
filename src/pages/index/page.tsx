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
    <div className="body-df min-h-screen max-h-screen flex flex-col items-center justify-center p-4">
      <div className="flex w-full flex-col items-center">
        <div className="flex w-full max-w-6xl flex-col items-center">
          <IndexHeader showOnlyLogo={shouldBlockContent} />
          {hasInitializedPermissionStatus && (
            <>
              {shouldBlockContent ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-4">
                  <IndexNotificationRequest />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-24 w-full">
                  <div className="shrink-0 md:self-start pt-4 flex flex-col gap-8 items-center">
                    <IndexTimer />
                    <IndexScore />
                  </div>
                  <div className="flex-1 w-full max-w-2xl">
                    <IndexTasks />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
