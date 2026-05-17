import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ipcBridge } from '@/common';

type NicknameStore = Record<string, Record<string, string>>;

function nicknamePath(): string {
  return path.join(app.getPath('userData'), 'nicknames.json');
}

function readStore(): NicknameStore {
  try {
    const raw = fs.readFileSync(nicknamePath(), 'utf-8');
    return JSON.parse(raw) as NicknameStore;
  } catch {
    return {};
  }
}

function writeStore(store: NicknameStore): void {
  fs.writeFileSync(nicknamePath(), JSON.stringify(store, null, 2));
}

export function initNicknamesBridge(): void {
  ipcBridge.providerNicknames.setDisplayName.provider(async ({ providerId, modelId, nickname }) => {
    const store = readStore();
    if (!store[providerId]) store[providerId] = {};
    if (nickname.trim()) {
      store[providerId][modelId] = nickname.trim();
    } else {
      delete store[providerId][modelId];
    }
    writeStore(store);
  });

  ipcBridge.providerNicknames.getDisplayNames.provider(async ({ providerId }) => {
    const store = readStore();
    return store[providerId] ?? {};
  });
}
