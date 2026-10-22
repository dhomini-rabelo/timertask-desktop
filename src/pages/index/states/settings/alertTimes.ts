export const defaultAlertTimes = [15, 30, 45, 60];
export const defaultAlertTime = 30;
export const minAlertTime = 1;
export const maxAlertTime = 240;
export const minAlertTimesCount = 3;
export const maxAlertTimesCount = 5;

export const invalidAlertTimeMessage = `Enter whole minutes from ${minAlertTime} to ${maxAlertTime}.`;
export const duplicatedAlertTimeMessage = "This time is already on the list.";

export interface AlertTimesSettings {
  alertTimes: number[];
  defaultAlertTime: number;
}

export type AlertTimeValidation =
  | { isValid: true; minutes: number }
  | { isValid: false; message: string };

export function sortAlertTimes(alertTimes: number[]): number[] {
  return [...alertTimes].sort((first, second) => first - second);
}

function isAlertTime(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minAlertTime &&
    value <= maxAlertTime
  );
}

export function getDefaultAlertTimesSettings(): AlertTimesSettings {
  return {
    alertTimes: [...defaultAlertTimes],
    defaultAlertTime,
  };
}

export function parseAlertTimesSettings(value: {
  alertTimes?: unknown;
  defaultAlertTime?: unknown;
}): AlertTimesSettings {
  const { alertTimes, defaultAlertTime: storedDefault } = value;
  if (!Array.isArray(alertTimes) || !alertTimes.every(isAlertTime)) {
    return getDefaultAlertTimesSettings();
  }

  const hasDuplicates = new Set(alertTimes).size !== alertTimes.length;
  const hasValidCount =
    alertTimes.length >= minAlertTimesCount &&
    alertTimes.length <= maxAlertTimesCount;
  const hasValidDefault =
    isAlertTime(storedDefault) && alertTimes.includes(storedDefault);
  if (hasDuplicates || !hasValidCount || !hasValidDefault) {
    return getDefaultAlertTimesSettings();
  }

  return {
    alertTimes: sortAlertTimes(alertTimes),
    defaultAlertTime: storedDefault,
  };
}

export function validateNewAlertTime(
  input: string,
  alertTimes: number[],
): AlertTimeValidation {
  const trimmedInput = input.trim();
  if (!/^\d+$/.test(trimmedInput)) {
    return { isValid: false, message: invalidAlertTimeMessage };
  }

  const minutes = Number(trimmedInput);
  if (!isAlertTime(minutes)) {
    return { isValid: false, message: invalidAlertTimeMessage };
  }

  if (alertTimes.includes(minutes)) {
    return { isValid: false, message: duplicatedAlertTimeMessage };
  }

  return { isValid: true, minutes };
}

export function formatAlertTimeLabel(minutes: number): string {
  return `${minutes} min`;
}

export function isAlertMinutesInList(
  alertMinutes: string | undefined,
  alertTimes: number[],
): alertMinutes is string {
  return alertMinutes !== undefined && alertTimes.includes(Number(alertMinutes));
}

export function resolveAlertMinutes(
  alertMinutes: string | undefined,
  settings: AlertTimesSettings,
): string {
  return isAlertMinutesInList(alertMinutes, settings.alertTimes)
    ? alertMinutes
    : String(settings.defaultAlertTime);
}
