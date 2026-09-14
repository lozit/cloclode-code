// Renders the status line from a synthetic payload, so a change can be checked
// without waiting for a real session to reach the state you want.
//
//   node scripts/demo.mjs                # tool state, 34% of the context window
//   node scripts/demo.mjs tool_error     # one state
//   node scripts/demo.mjs idle 92        # one state, at 92% of the window
//   node scripts/demo.mjs --phrases      # every phrase, stacked
//   node scripts/demo.mjs --heat         # the same state as the window fills up
//   node scripts/demo.mjs --sway         # six consecutive events, to see the sway
//   node scripts/demo.mjs --claudettes   # the troupe filling up, nought to four

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHRASES } from './phrases.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const dataDir = mkdtempSync(join(tmpdir(), 'cloclode-demo-'));
const WINDOW = 200000;

function render(state, percent, tick = 0, turn = 0, crew = 0) {
  writeFileSync(
    join(dataDir, `state-${state}.json`),
    JSON.stringify({ state, at: Date.now(), tick, turn, crew }),
  );

  const payload = {
    session_id: state,
    model: { display_name: 'Opus 5' },
    workspace: { current_dir: root },
    context_window: {
      total_input_tokens: Math.round((WINDOW * percent) / 100),
      total_output_tokens: 0,
      context_window_size: WINDOW,
    },
  };

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(here, 'statusline.mjs')], {
      stdio: ['pipe', 'inherit', 'inherit'],
      env: { ...process.env, CLAUDE_PLUGIN_DATA: dataDir },
    });
    child.stdin.end(JSON.stringify(payload));
    child.on('exit', () => {
      process.stdout.write('\n');
      resolve();
    });
  });
}

function label(text) {
  process.stdout.write(`[2m${text}[0m\n`);
}

const [first = 'tool', second = '34'] = process.argv.slice(2);
const percent = Number.isFinite(Number(second)) ? Number(second) : 34;

if (first === '--phrases') {
  for (let turn = 0; turn < PHRASES.length; turn += 1) {
    await render('thinking', percent, 0, turn);
    process.stdout.write('\n');
  }
} else if (first === '--claudettes') {
  for (let crew = 0; crew <= 4; crew += 1) {
    label(`${crew} sur scène`);
    await render('tool', percent, crew, 3, crew);
    process.stdout.write('\n');
  }
} else if (first === '--sway') {
  // One render per event, the way Claude Code drives it during a tool call.
  const beat = ['tool', 'tool_done'];
  for (let tick = 0; tick < 6; tick += 1) {
    const state = beat[tick % beat.length];
    label(`event ${tick + 1} (${state})`);
    await render(state, percent, tick);
    process.stdout.write('\n');
  }
} else if (first === '--heat') {
  for (const step of [0, 60, 75, 90, 100]) {
    label(`${step}%`);
    await render('tool', step);
    process.stdout.write('\n');
  }
} else if (first.startsWith('--')) {
  process.stderr.write(
    `unknown flag "${first}" - try --phrases, --sway, --heat or --claudettes\n`,
  );
  process.exit(1);
} else {
  await render(first, percent);
}
