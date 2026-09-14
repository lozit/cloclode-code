import { writeState, readStdinJson } from './state.mjs';

const requested = process.argv[2] || 'thinking';
const payload = await readStdinJson();

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
