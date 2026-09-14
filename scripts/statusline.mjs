import { basename } from 'node:path';
import { readState, readStdinJson } from './state.mjs';
import { pick } from './phrases.mjs';
import {
  renderSprite,
  renderClaudette,
  SPRITE_WIDTH,
  CLAUDETTE_WIDTH,
} from './sprite.mjs';

const input = await readStdinJson();
const { tick, turn, crew } = readState(input.session_id);
const { title } = pick(turn);

const window = input.context_window || {};
const used = (window.total_input_tokens || 0) + (window.total_output_tokens || 0);
const size = window.context_window_size || 200000;
const ratio = size > 0 ? Math.min(used / size, 1) : 0;
const heat = ratio > 0.6 ? (ratio - 0.6) / 0.4 : 0;

const color = process.env.NO_COLOR ? false : true;
const dim = color ? '\u001b[2m' : '';
const reset = color ? '\u001b[0m' : '';

// Anything wider than the terminal wraps, which would break the three-line
// block apart. Claude Code passes COLUMNS, so cut to what actually fits.
const GAP = 2;
const MIN_TEXT = 24;
const columns = Number(process.env.COLUMNS) || 80;

// The troupe is decoration, so it only takes room the phrase can spare: the
// count itself always shows in the metadata line, however many are dancing.
const dancerCost = CLAUDETTE_WIDTH + 1;
const spare = columns - SPRITE_WIDTH - GAP - MIN_TEXT;
const onStage = Math.max(0, Math.min(crew, Math.floor(spare / dancerCost)));

const stage = renderSprite({ heat, color, tick });
for (let i = 0; i < onStage; i += 1) {
  const dancer = renderClaudette({ heat, color, tick });
  for (let line = 0; line < stage.length; line += 1) {
    stage[line] += ` ${dancer[line]}`;
  }
}

const stageWidth = SPRITE_WIDTH + onStage * dancerCost;
const budget = Math.max(8, columns - stageWidth - GAP);

const model = input.model?.display_name || 'claude';
const dir = basename(input.workspace?.current_dir || input.cwd || '');
const context = ratio > 0 ? `${Math.round(ratio * 100)}%` : '';
const troupe = crew > 0 ? `${crew} Claudette${crew > 1 ? 's' : ''}` : '';
const meta = [model, dir, context, troupe].filter(Boolean).join(' · ');

// Counted in code points, not UTF-16 units, so cutting never splits an emoji
// in half. Wide glyphs still take two columns on screen - that is on the author
// of the phrase, not on the clipping.
function fit(text, width) {
  const chars = [...text];
  if (chars.length <= width) return text;
  return `${chars.slice(0, width - 1).join('')}…`;
}

const right = [
  fit(`♪ ${title}`, budget),
  `${dim}${fit(meta, budget)}${reset}`,
  '',
];

const out = stage.map((line, i) => `${line}  ${right[i] || ''}`.trimEnd());
process.stdout.write(out.join('\n'));
