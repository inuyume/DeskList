import { getCurrentWindow } from "@tauri-apps/api/window";

export function useWindowControls() {
  async function setAlwaysOnTop(value: boolean) {
    await getCurrentWindow().setAlwaysOnTop(value);
  }
  async function hideWindow() { await getCurrentWindow().hide(); }
  return { setAlwaysOnTop, hideWindow };
}
