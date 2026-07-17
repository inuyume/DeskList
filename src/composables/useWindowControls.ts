import { getCurrentWindow, Window } from "@tauri-apps/api/window";

export function useWindowControls() {
  async function setAlwaysOnTop(value: boolean) {
    await getCurrentWindow().setAlwaysOnTop(value);
  }
  async function hideWindow() { await getCurrentWindow().hide(); }
  async function setFloatingWindowVisible(value: boolean) {
    const floating = await Window.getByLabel("floating");
    if (!floating) throw new Error("悬浮窗尚未创建");
    if (value) {
      await floating.show();
      await floating.setAlwaysOnTop(true);
    } else {
      await floating.hide();
    }
  }
  async function showMainWindow() {
    const main = await Window.getByLabel("main");
    if (!main) return;
    await main.show();
    await main.unminimize();
    await main.setFocus();
  }
  return { setAlwaysOnTop, hideWindow, setFloatingWindowVisible, showMainWindow };
}
