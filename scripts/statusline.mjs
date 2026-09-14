import { basename } from 'node:path';
import { readState, readStdinJson } from './state.mjs';
import { pick } from './phrases.mjs';
import { renderSprite, SPRITE_WIDTH } from './sprite.mjs';

const input = await readStdinJson();
const { tick, turn } = readState(input.session_id);
const { title } = pick(turn);

const window = input.context_window || {};
const used = (window.total_input_tokens || 0) + (window.total_output_tokens || 0);
const size = window.context_window_size || 200000;
const ratio = size > 0 ? Math.min(used / size, 1) : 0;
const heat = ratio > 0.6 ? (ratio - 0.6) / 0.4 : 0;

const color = process.env.NO_COLOR ? false : true;
const dim = color ? '\u001b[2m' : '';
const reset = color ? '\u001b[0m' : '';

const model = input.model?.display_name || 'claude';
const dir = basename(input.workspace?.current_dir || input.cwd || '');
const context = ratio > 0 ? `${Math.round(ratio * 100)}%` : '';
const meta = [model, dir, context].filter(Boolean).join(' \u00b7 ');

// Anything wider than the terminal wraps, which would break the three-line
// block apart. Claude Code passes COLUMNS, so cut to what actually fits.
const GAP = 2;
const columns = Number(process.env.COLUMNS) || 80;
const budget = Math.max(8, columns - SPRITE_WIDTH - GAP);

// Counted in code points, not UTF-16 units, so cutting never splits an emoji
// in half. Wide glyphs still take two columns on screen - that is on the author
// of the phrase, not on the clipping.
function fit(text, width) {
  const chars = [...text];
  if (chars.length <= width) return text;
  return `${chars.slice(0, width - 1).join('')}\u2026`;
}

const lines = renderSprite({ heat, color, tick });
const right = [
  fit(`\u266a ${title}`, budget),
  `${dim}${fit(meta, budget)}${reset}`,
  '',
];

const out = lines.map((line, i) => `${line}  ${right[i] || ''}`.trimEnd());
process.stdout.write(out.join('\n'));
