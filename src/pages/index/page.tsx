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
    <div className="body-df min-h-screen max-h-screen flex flex-col">
      <div className="flex w-full flex-1 flex-col p-4">
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full max-w-6xl flex-col items-center">
            <IndexHeader showOnlyLogo={shouldBlockContent} />
            {hasInitializedPermissionStatus && (
              <>
                {shouldBlockContent ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
                    <IndexNotificationRequest />
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center justify-center gap-24 md:flex-row md:items-start">
                    <div className="flex shrink-0 flex-col items-center gap-8 pt-4 md:self-start">
                      <IndexTimer />
                      <IndexScore />
                    </div>
                    <div className="w-full max-w-2xl flex-1">
                      <IndexTasks />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
