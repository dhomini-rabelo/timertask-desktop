import { isPermissionGranted } from "@tauri-apps/plugin-notification";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { Box } from "../../layout/components/atoms/Box";
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
      <div className="flex w-full flex-1 flex-col p-4">
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full max-w-6xl flex-col items-center">
            {shouldBlockContent && (
              <IndexHeader showOnlyLogo={shouldBlockContent} />
            )}
            {hasInitializedPermissionStatus && (
              <>
                {shouldBlockContent ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
                    <IndexNotificationRequest />
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-6">
                    <Box className="w-full flex flex-col gap-6 p-6">
                      <IndexHeader />
                      <IndexTimer />
                      <IndexScore />
                    </Box>
                    <IndexTasks />
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
