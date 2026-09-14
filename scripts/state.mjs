import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function baseDir() {
  const dir = process.env.CLAUDE_PLUGIN_DATA || join(tmpdir(), 'cloclode-code');
  try {
    mkdirSync(dir, { recursive: true });
  } catch {}
  return dir;
}

function fileFor(sessionId) {
  const safe = String(sessionId || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
  return join(baseDir(), `state-${safe || 'default'}.json`);
}

// `thinking` is what UserPromptSubmit writes, so it marks the start of a turn.
const TURN_STARTS_ON = 'thinking';

// Two counters, two cadences. `tick` counts every event and drives the sway, so
// the shoulders move as often as something happens. `turn` only advances when
// the user speaks, so a phrase stays put long enough to be read.
export function writeState(sessionId, state) {
  const path = fileFor(sessionId);
  const previous = readState(sessionId);
  const tick = (previous.tick + 1) % 1e6;
  const turn = (previous.turn + (state === TURN_STARTS_ON ? 1 : 0)) % 1e6;
  const payload = JSON.stringify({ state, at: Date.now(), tick, turn });
  try {
    // Write then rename, so a reader never sees a half-written file and no
    // temporary is left behind.
    writeFileSync(`${path}.tmp`, payload);
    renameSync(`${path}.tmp`, path);
  } catch {}
}

export function readState(sessionId) {
  try {
    const raw = JSON.parse(readFileSync(fileFor(sessionId), 'utf8'));
    const tick = Number.isInteger(raw.tick) ? raw.tick : 0;
    const turn = Number.isInteger(raw.turn) ? raw.turn : 0;
    if (Date.now() - raw.at > 5 * 60 * 1000) {
      return { state: 'idle', at: raw.at, tick, turn };
    }
    return { ...raw, tick, turn };
  } catch {
    return { state: 'thinking', at: Date.now(), tick: 0, turn: 0 };
  }
}

export function readStdinJson() {
  return new Promise((resolve) => {
    let buffer = '';
    const timer = setTimeout(() => resolve({}), 400);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(buffer));
      } catch {
        resolve({});
      }
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}
