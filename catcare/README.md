# CatCare

An educational browser game about caring for a virtual cat. The simulation includes pathfinding (A*), probability estimates (Bayes), and sequential decisions (MDP). The model is **not veterinary advice**.

## Run

- **Standalone:** open `dist/catcare.html` in your browser. No server is needed.
- **Development:** run `npm start` (requires Node.js), then open the URL printed in the terminal.
- **Rebuild the standalone file:** `npm run build`.
- **Tests:** `npm test`.

## Gameplay

- Follow the cat between the kitchen, living room, bedroom, and bathroom.
- When something seems wrong, choose checks, observe changes, or find an available clinic.
- Unlock educational handbook pages and achievements.
- Double-click directly on the cat to pet it.
- Use the **Dark Mode / Light Mode** button to switch themes. Your choice is remembered.
- **Pause** saves your current game progress. **Start Over** resets game progress.

## Project structure

- `index.html` and `css/style.css`: interface and theme styles.
- `js/`: simulation, algorithms, rendering, and user interface.
- `data/`: sample scenarios, disease facts, book content, and city map.
- `assets/`: pixel art and the room-image generator.
- `tools/`: local server and standalone build tool.
- `tests/`: automated checks.
- `dist/catcare.html`: self-contained playable version.

This project is for learning only. All numeric probabilities and rewards are illustrative assumptions, not real medical predictions.
