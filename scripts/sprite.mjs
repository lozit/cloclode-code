const PALETTE = {
  H: [217, 164, 65],
  h: [240, 217, 155],
  S: [201, 128, 92],
  E: [26, 19, 16],
  W: [242, 239, 234],
  J: [52, 58, 84],
  D: [74, 48, 44],
  R: [176, 58, 84],
  '.': null,
};

// Rows 2 and 3 share one terminal line, row 2 landing on its top half. The face
// never changes: the only thing that moves is the shoulder line, so the sprite
// is a single grid rather than a set of expressions.
const CLOCLO = [
  '.HHHHHH.',
  'HhhHHHHH',
  'HSESSESH',
  'HSSSSSSH',
  '.SSSSSS.',
  'JJWWWWJJ',
];

// A backing dancer: half the width, no eyes. At four columns a face would be
// two pixels wide, so detail reads as noise - the silhouette carries it.
const CLAUDETTE = [
  '.DD.',
  'DDDD',
  'DSSD',
  '.SS.',
  '.SS.',
  'RRRR',
];

// The sway: one shoulder lifts a pixel above the shoulder line while the other
// stays down, and they trade on the next event. Only the outer columns are free
// above that line - the inner ones carry the jaw - so the raised side shows as
// a full cell next to the lowered side's half cell.
const CLOCLO_SWAY = ['JSSSSSS.', '.SSSSSSJ'];
const CLAUDETTE_SWAY = ['RSS.', '.SSR'];

function lerp(from, to, t) {
  return from.map((c, i) => Math.round(c + (to[i] - c) * t));
}

// Only the face reacts to a filling context window: it tans first, then catches
// the sun in the last stretch. Hair, jacket and collar keep their own colour, so
// the change reads as a suntan rather than the whole sprite going red.
const TAN = [173, 96, 56];
const BURN = [188, 63, 45];
const TAN_UNTIL = 0.6;

function suntan(rgb, heat) {
  const t = Math.min(heat, 1);
  if (t <= TAN_UNTIL) return lerp(rgb, TAN, t / TAN_UNTIL);
  return lerp(TAN, BURN, (t - TAN_UNTIL) / (1 - TAN_UNTIL));
}

function tint(key, heat) {
  const rgb = PALETTE[key];
  if (!rgb || heat <= 0 || key !== 'S') return rgb;
  return suntan(rgb, heat);
}

function fg([r, g, b]) {
  return `\u001b[38;2;${r};${g};${b}m`;
}

function bg([r, g, b]) {
  return `\u001b[48;2;${r};${g};${b}m`;
}

const RESET = '\u001b[0m';

function render(grid, sway, { heat, color, tick }) {
  const shoulders = grid.length - 2;
  const rows =
    tick === null
      ? grid
      : grid.map((row, i) =>
          i === shoulders ? sway[Math.abs(tick) % sway.length] : row,
        );
  const lines = [];

  for (let y = 0; y < rows.length; y += 2) {
    const top = rows[y];
    const bottom = rows[y + 1] || '.'.repeat(top.length);
    let line = '';

    for (let x = 0; x < top.length; x++) {
      const t = tint(top[x], heat);
      const b = tint(bottom[x], heat);

      if (!color) {
        line += t || b ? '█' : ' ';
        continue;
      }
      if (!t && !b) line += ' ';
      else if (t && !b) line += `${fg(t)}▀${RESET}`;
      else if (!t && b) line += `${fg(b)}▄${RESET}`;
      else line += `${fg(t)}${bg(b)}▀${RESET}`;
    }
    // Claude Code strips leading whitespace from every status line row, which
    // would shift a row whose first pixel is transparent one column left. An
    // escape sequence in front keeps the row anchored; the grids avoid the case
    // anyway, this only guards grids added later.
    if (color && line.startsWith(' ')) line = RESET + line;
    lines.push(line);
  }
  return lines;
}

export function renderSprite({ heat = 0, color = true, tick = null } = {}) {
  return render(CLOCLO, CLOCLO_SWAY, { heat, color, tick });
}

// Offset by one so the troupe sways against the star: when Cloclo lifts his
// left shoulder, the Claudettes lift their right. Two independent animations
// become one choreography.
export function renderClaudette({ heat = 0, color = true, tick = null } = {}) {
  const counter = tick === null ? null : tick + 1;
  return render(CLAUDETTE, CLAUDETTE_SWAY, { heat, color, tick: counter });
}

export const SPRITE_WIDTH = 8;
export const CLAUDETTE_WIDTH = 4;
