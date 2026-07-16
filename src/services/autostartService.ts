import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

export async function getAutostartEnabled() { return isEnabled(); }
export async function setAutostartEnabled(value: boolean) { return value ? enable() : disable(); }
