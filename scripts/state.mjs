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
// `idle` is what Stop writes: the turn is over, so nobody is left on stage.
// Without this the crew count would drift up for good if a SubagentStop were
// ever missed, and Cloclo would keep a phantom chorus.
const STAGE_CLEARS_ON = 'idle';

function save(sessionId, fields) {
  const path = fileFor(sessionId);
  const payload = JSON.stringify({ at: Date.now(), ...fields });
  try {
    // Write then rename, so a reader never sees a half-written file and no
    // temporary is left behind.
    writeFileSync(`${path}.tmp`, payload);
    renameSync(`${path}.tmp`, path);
  } catch {}
}

// Three counters, three cadences. `tick` counts every event and drives the
// sway, so the shoulders move as often as something happens. `turn` only
// advances when the user speaks, so a phrase stays put long enough to be read.
// `crew` is how many subagents are running right now.
export function writeState(sessionId, state) {
  const previous = readState(sessionId);
  save(sessionId, {
    state,
    tick: (previous.tick + 1) % 1e6,
    turn: (previous.turn + (state === TURN_STARTS_ON ? 1 : 0)) % 1e6,
    crew: state === STAGE_CLEARS_ON ? 0 : previous.crew,
  });
}

// A Claudette walks on or off. The tick advances too, so the troupe arriving is
// itself a dance step.
export function bumpCrew(sessionId, delta) {
  const previous = readState(sessionId);
  save(sessionId, {
    state: previous.state,
    tick: (previous.tick + 1) % 1e6,
    turn: previous.turn,
    crew: Math.max(0, previous.crew + delta),
  });
}

export function readState(sessionId) {
  try {
    const raw = JSON.parse(readFileSync(fileFor(sessionId), 'utf8'));
    const tick = Number.isInteger(raw.tick) ? raw.tick : 0;
    const turn = Number.isInteger(raw.turn) ? raw.turn : 0;
    const crew = Number.isInteger(raw.crew) ? Math.max(0, raw.crew) : 0;
    if (Date.now() - raw.at > 5 * 60 * 1000) {
      return { state: 'idle', at: raw.at, tick, turn, crew: 0 };
    }
    return { ...raw, tick, turn, crew };
  } catch {
    return { state: 'thinking', at: Date.now(), tick: 0, turn: 0, crew: 0 };
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
