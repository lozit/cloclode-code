import {
  readFileSync,
  writeFileSync,
  renameSync,
  copyFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const renderer = resolve(here, 'statusline.mjs');
const hook = resolve(here, 'hook.mjs');
const settingsPath = join(homedir(), '.claude', 'settings.json');

// The status line alone renders a frozen Cloclo: without these, nothing ever
// writes the session state, so the sway and the phrase rotation never advance.
const HOOKS = [
  { event: 'SessionStart', state: 'start' },
  { event: 'UserPromptSubmit', state: 'thinking' },
  { event: 'PreToolUse', state: 'tool', matcher: '*' },
  { event: 'PostToolUse', state: 'tool_done', matcher: '*' },
  { event: 'Notification', state: 'permission' },
  { event: 'PreCompact', state: 'compact' },
  { event: 'Stop', state: 'idle' },
];

mkdirSync(dirname(settingsPath), { recursive: true });

let settings = {};
if (existsSync(settingsPath)) {
  copyFileSync(settingsPath, `${settingsPath}.cloclode.bak`);
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  } catch {
    console.error("settings.json illisible — rien n'a été modifié.");
    process.exit(1);
  }
}

const previous = settings.statusLine;
if (previous && previous.command && !previous.command.includes('cloclode')) {
  console.log(`Ancienne status line sauvegardée : ${previous.command}`);
}

settings.statusLine = {
  type: 'command',
  command: `node "${renderer}"`,
  padding: 0,
};

const prefix = `node "${hook}"`;
settings.hooks = settings.hooks || {};

let added = 0;
for (const { event, state, matcher } of HOOKS) {
  const bucket = settings.hooks[event] || (settings.hooks[event] = []);
  const already = bucket.some((group) =>
    (group.hooks || []).some((h) => (h.command || '').startsWith(prefix)),
  );
  if (already) continue;

  const entry = { hooks: [{ type: 'command', command: `${prefix} ${state}` }] };
  if (matcher) entry.matcher = matcher;
  // Appended, so hooks that were already configured keep running first.
  bucket.push(entry);
  added += 1;
}

const payload = `${JSON.stringify(settings, null, 2)}\n`;
writeFileSync(`${settingsPath}.tmp`, payload);
renameSync(`${settingsPath}.tmp`, settingsPath);

console.log(`Status line installée dans ${settingsPath}`);
console.log(
  added === 0
    ? 'Hooks : déjà en place, rien à ajouter.'
    : `Hooks : ${added} ajouté${added > 1 ? 's' : ''} sur ${HOOKS.length}.`,
);
console.log(`Sauvegarde : ${settingsPath}.cloclode.bak`);
console.log('Claude Code recharge les réglages tout seul ; relance-le si rien ne bouge.');
