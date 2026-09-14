import { writeState, bumpCrew, readStdinJson } from './state.mjs';

const requested = process.argv[2] || 'thinking';
const payload = await readStdinJson();

// A subagent walking on or off stage adjusts the crew count without touching
// the turn: a Claudette arriving is not the user speaking.
const CREW = { crew_in: 1, crew_out: -1 };

if (requested in CREW) {
  bumpCrew(payload.session_id, CREW[requested]);
  process.exit(0);
}

let state = requested;

if (requested === 'tool_done') {
  const response = payload.tool_response;
  const failed =
    response?.success === false ||
    response?.is_error === true ||
    typeof response?.error === 'string';
  state = failed ? 'tool_error' : 'tool_done';
}

writeState(payload.session_id, state);
process.exit(0);
