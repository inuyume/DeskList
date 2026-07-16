import { load, type Store } from "@tauri-apps/plugin-store";
import type { AppData } from "../types/todo";
import { createDefaultData, normalizeAppData } from "../utils/validation";

const DATA_KEY = "appData";
let mainStore: Store | null = null;
let backupStore: Store | null = null;

async function openStore(path: string, createNew = false) {
  return load(path, { autoSave: false, defaults: {}, createNew });
}

async function stores() {
  mainStore ??= await openStore("desklist.json");
  backupStore ??= await openStore("desklist.backup.json");
  return { main: mainStore, backup: backupStore };
}

export async function loadData(): Promise<{ data: AppData; recovered: boolean }> {
  let primary: AppData | null = null;
  try {
    mainStore = await openStore("desklist.json");
    primary = normalizeAppData(await mainStore.get<unknown>(DATA_KEY));
  } catch (error) {
    console.error("主数据文件无法加载", error);
    mainStore = null;
  }
  if (primary) {
    backupStore ??= await openStore("desklist.backup.json").catch(async () => openStore("desklist.backup.json", true));
    return { data: primary, recovered: false };
  }

  let fallback: AppData | null = null;
  try {
    backupStore = await openStore("desklist.backup.json");
    fallback = normalizeAppData(await backupStore.get<unknown>(DATA_KEY));
  } catch (error) {
    console.error("备份数据文件无法加载", error);
    backupStore = null;
  }
  mainStore ??= await openStore("desklist.json", true);
  if (fallback) {
    await mainStore.set(DATA_KEY, fallback);
    await mainStore.save();
    return { data: fallback, recovered: true };
  }
  const data = createDefaultData();
  backupStore ??= await openStore("desklist.backup.json", true);
  await mainStore.set(DATA_KEY, data);
  await mainStore.save();
  return { data, recovered: false };
}

export async function saveData(data: AppData): Promise<void> {
  const normalized = normalizeAppData(data);
  if (!normalized) throw new Error("拒绝保存无效数据");
  const { main, backup } = await stores();
  const previous = normalizeAppData(await main.get<unknown>(DATA_KEY));
  if (previous) {
    await backup.set(DATA_KEY, previous);
    await backup.save();
  }
  await main.set(DATA_KEY, normalized);
  await main.save();
}

export async function saveBackup(data: AppData): Promise<void> {
  const { backup } = await stores();
  await backup.set(DATA_KEY, data);
  await backup.save();
}
