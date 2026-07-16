import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { AppData } from "../types/todo";
import { normalizeAppData } from "../utils/validation";

export async function pickImportData(): Promise<AppData | null> {
  const path = await open({ multiple: false, directory: false, filters: [{ name: "JSON", extensions: ["json"] }] });
  if (!path) return null;
  const parsed: unknown = JSON.parse(await readTextFile(path));
  const data = normalizeAppData(parsed);
  if (!data) throw new Error("文件不是有效的 DeskList 备份");
  return data;
}

export async function exportData(data: AppData): Promise<boolean> {
  const date = new Date().toISOString().slice(0, 10);
  const path = await save({ defaultPath: `desklist-backup-${date}.json`, filters: [{ name: "JSON", extensions: ["json"] }] });
  if (!path) return false;
  await writeTextFile(path, JSON.stringify(data, null, 2));
  return true;
}
