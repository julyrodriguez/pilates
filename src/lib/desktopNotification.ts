export function isDesktopNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getDesktopNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isDesktopNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (!isDesktopNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch {
    return false;
  }
}

export function sendDesktopNotification(
  title: string,
  options?: {
    body?: string;
    tag?: string;
    onClick?: () => void;
  }
) {
  if (!isDesktopNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      body: options?.body,
      tag: options?.tag,
      silent: false, // Permite que Windows reproduzca su sonido de notificación
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch {}
      if (options?.onClick) {
        options.onClick();
      }
      notification.close();
    };
  } catch (err) {
    console.warn("Error enviando notificación de escritorio en Windows:", err);
  }
}
