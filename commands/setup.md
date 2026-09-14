---
description: Installe la status line Cloclo et ses hooks dans les réglages utilisateur de Claude Code
---

Installe la status line de Cloclode Code et les hooks dont elle a besoin, pour cet
utilisateur.

Étapes :

1. Exécute `node "${CLAUDE_PLUGIN_ROOT}/scripts/install.mjs"` avec l'outil Bash.
2. Rapporte le nombre de hooks ajoutés et le chemin de la sauvegarde affichés par le script.
3. Si zéro hook a été ajouté alors que c'est une première installation, signale-le : sans
   hooks, Cloclo s'affiche mais reste figé sur la première phrase, sans dandinement.

Le script est idempotent : relancé, il n'ajoute rien en double. Il fusionne avec les hooks
déjà présents plutôt que de les remplacer, et les laisse s'exécuter en premier.

Si le script signale une ancienne status line, propose de la restaurer depuis
`~/.claude/settings.json.cloclode.bak` au cas où l'utilisateur voudrait revenir en arrière.
