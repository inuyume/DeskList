import { getCurrentWindow } from "@tauri-apps/api/window";
import { register } from "@tauri-apps/plugin-global-shortcut";

export const DEFAULT_SHORTCUT = "Control+Alt+Space";

export async function registerWindowShortcut(onShown: () => void): Promise<void> {
  const appWindow = getCurrentWindow();
  await register(DEFAULT_SHORTCUT, async (event) => {
    if (event.state !== "Pressed") return;
    if (await appWindow.isVisible()) {
      await appWindow.hide();
      return;
    }
    await appWindow.show();
    await appWindow.unminimize();
    await appWindow.setFocus();
    onShown();
  });
}
