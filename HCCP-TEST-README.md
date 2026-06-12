### HCCP-TEST: Full rewrite applied

This commit rewrites the core JavaScript (hand-cricket.js), cleans up the HTML pages (index.html, profile.html, ledger.html, tournament.html), and consolidates/cleans style.css.

What I changed:
- hand-cricket.js: reorganized into Storage, Audio, UI, Game, Shop modules. Defensive coding, safe localStorage, protected DOM access, audio.play() .catch, single source of economy logic.
- HTML pages: cleaned up broken/truncated attributes, ensured elements required by JS are present.
- style.css: removed duplicate blocks and provided a concise responsive theme preserving visual style.

Next steps:
- Please review the HCCP-TEST branch at https://github.com/Annant2122011/Meow/tree/HCCP-TEST
- I will open a PR in a moment for you to review and test in the browser.

