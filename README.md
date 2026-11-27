# Glyphwerk

Schrift-Editor fürs iPad (Font editor for iPad). Läuft im Browser, ohne Konto: https://mariokupcevsky.github.io/glyphwerk/

Projekte werden nur im eigenen Browser gespeichert, also ab und zu „Projekt sichern“.

## Entwicklung

Der Code liegt in `src/`, aufgeteilt nach Bereichen:

- `src/core/` Datenmodell, Geometrie, Federstriche, Abstände, Kerning
- `src/export/` TTF-, CFF/OTF- und ZIP-Writer, OpenType-Feature-Compiler
- `src/rules/` Regel-Buchstaben aus Skeletten
- `src/raster/` Pixel-Raster-Modus
- `src/ui/` Oberfläche (Canvas, Eingabe, Inspektor, Sheets, Sprache)

`index.html` wird daraus gebaut (Reihenfolge in `src/order.txt`) und bleibt eine einzige Datei, weil GitHub Pages und das claude.ai-Artifact das brauchen. Nie `index.html` direkt bearbeiten.

```
npm ci
npm run build   # src/ -> index.html
npm test        # Export-Round-Trip + iPad-Smoke-Test (braucht Playwright + Chromium)
```

CI prüft bei jedem PR, dass `index.html` dem Build von `src/` entspricht, und lässt die Tests laufen.
