import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export type ActivityEventType = 'login' | 'command' | 'chat' | 'paired-device-added' | 'paired-device-revoked';

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  detail: string;
  deviceId?: string;
  ts: number;
};

const RING_SIZE = 200;

function logPath(): string {
  return path.join(app.getPath('userData'), 'webui-activity.json');
}

function readLog(): ActivityEvent[] {
  try {
    const raw = fs.readFileSync(logPath(), 'utf-8');
    return JSON.parse(raw) as ActivityEvent[];
  } catch {
    return [];
  }
}

function writeLog(events: ActivityEvent[]): void {
  fs.writeFileSync(logPath(), JSON.stringify(events, null, 2));
}

let _counter = 0;

function nextId(): string {
  return `${Date.now()}-${++_counter}`;
}

export function appendActivity(type: ActivityEventType, detail: string, deviceId?: string): void {
  const events = readLog();
  events.push({ id: nextId(), type, detail, deviceId, ts: Date.now() });
  // keep newest RING_SIZE entries
  const trimmed = events.length > RING_SIZE ? events.slice(events.length - RING_SIZE) : events;
  writeLog(trimmed);
}

export function getActivity(limit?: number): ActivityEvent[] {
  const events = readLog();
  const sorted = events.slice().toReversed(); // newest first
  return limit !== undefined ? sorted.slice(0, limit) : sorted;
}
