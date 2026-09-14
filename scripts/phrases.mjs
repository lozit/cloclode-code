// One shared pool rather than a list per state: these lines are not about tools
// or errors, so tying them to a particular event would be arbitrary. The state
// machine still drives the sway; the phrase just rotates.
export const PHRASES = [
  "C'est pas le conseiller clientèle qui vous parle, c'est l'artiste",
  "Si j'avais été Sardou, tu te serais déjà pris un coup de latte",
  "Johnny Hallyday, à côté, c'est un Playmobil dans un évier",
  'Eh toi là-bas avec le calamar sur la tête !',
  'Un mari sans maîtresse ? Tu mérites mieux que ça, mon ange.',
  'Brassens ? Le moustachu qui fait rimer « couille » avec « nouille » ?',
  'Claude, dès potron-minet, il était ici et il yoggait',
];

// Indexed by turn, not by clock: the phrase changes when the user speaks.
export function pick(turn = 0) {
  return { title: PHRASES[Math.abs(turn) % PHRASES.length] };
}
