# Export Spanish Coach decks to Anki

Need to run a focused review in Anki? Use this quick checklist to turn the in-app flashcards into an `.apkg` you can share or review offline.

1. **Open the Content manager** and download the latest seed bundle so your local JSON matches the cards in the trainer.
2. **Run the export script** from the project root:
   ```bash
   npm run build
   node scripts/export-anki-deck.mjs
   ```
   This generates an Anki-friendly package inside the `exports/` folder.
3. **Import the package into Anki** and assign it to the deck of your choice. All cards retain their tags (`grammar`, `verbs`, `vocab`, `presentations`) so you can keep filters aligned with the web app.

For screenshots and troubleshooting tips, read the full [Anki export playbook](./d2-anki-guide.md).
