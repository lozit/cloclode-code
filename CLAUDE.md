# Cloclode Code

## Langue : le français est la règle ici

Exception assumée à « tout ce qui entre dans un dépôt s'écrit en anglais ». Ce plugin est
français, écrit pour des francophones, et son contenu repose sur des jeux de mots qui ne
survivraient pas à une traduction. Le français est donc admis partout : README, manifestes,
phrases, sorties utilisateur, messages de commit.

C'est permissif, pas impératif. Ce qui est déjà en anglais — les commentaires de code, les
identifiants, le premier message de commit — n'a pas à être traduit. Ne réécrivez rien pour
uniformiser.

Cette exception vaut pour ce dépôt seulement.

## Invariants à ne pas casser

Quatre contraintes non évidentes, documentées en détail dans le `README.md` :

- **La colonne 0 du sprite doit rester opaque.** Claude Code rogne les blancs en tête de
  chaque ligne de status line ; un pixel transparent en colonne 0 décale toute la ligne.
- **Aucune animation minutée.** La status line n'est rendue que sur événement — jamais au
  repos. Toute animation s'indexe sur les compteurs de l'état, pas sur l'horloge.
- **Les hooks ne sont pas optionnels.** Sans eux rien n'écrit l'état de session, et la
  mascotte est figée sur la première phrase, sans dandinement.
- **Le compteur de Claudettes se remet à zéro sur `Stop`.** Ce n'est pas redondant avec
  `SubagentStop` : c'est le filet qui empêche un compte manqué de dériver vers le haut
  définitivement.

## Droits

Les phrases sont des textes originaux. Aucun vers de chanson : les paroles de Claude
François sont protégées et activement défendues par ses ayants droit. Les titres restent
utilisables, les paroles non.
