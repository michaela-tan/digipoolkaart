# Digipoolkaart

Een kaart van Nederland met de pools voor flexibele inzet van digitaliseringspersoneel, met zoeken en filteren op organisatie en vakgebied. Gebouwd met het [NLDD Designsysteem](https://nederlandsedigitaledienst.github.io/design-system/) (`@nldd/design-system` 0.22.0).

## Bekijken

Open `index.html` in de browser. Er is geen build nodig: de NLDD-componenten komen van jsDelivr en de eigen scripts zijn gewone `<script>`-bestanden, dus het werkt ook direct vanaf schijf.

## Opbouw

| Bestand | Wat |
|---|---|
| `index.html` | De pagina: `nldd-shell` › `nldd-page` › `nldd-sidebar-section` volgens het NLDD-patroon "Filteren" |
| `js/pools.js` | De pools (**voorbeelddata, fictief**) en de filteropties |
| `js/app.js` | Filterlogica: zoeken, filterknoppen, tokens voor actieve filters, lijst en detailvenster (`nldd-sheet`) |
| `js/digipool-kaart.js` | Eigen component `<digipool-kaart>`: tekent de provincies en een markering per plaats |
| `css/digipool-kaart.css` | Stijl van alleen dat eigen component, met `--primitives-*`-kleuren |
| `js/kaart-nederland.js` | Gegenereerde SVG-paden van de provincies |
| `data/provincie_2026.geojson` | Bron van de kaart |
| `tools/maak_kaart.py` | Zet de GeoJSON om naar `js/kaart-nederland.js` |

## De kaart

De provinciegrenzen komen uit de CBS Gebiedsindelingen via PDOK, vereenvoudigd door [cartomap/nl](https://github.com/cartomap/nl). Licentie: CC BY 4.0, dus de bronvermelding onderaan de pagina moet blijven staan.

Een ander jaar of gemeentegrenzen? Download een ander bestand van `https://cartomap.github.io/nl/wgs84/<regio>_<jaar>.geojson` en draai:

```bash
python3 tools/maak_kaart.py data/provincie_2026.geojson js/kaart-nederland.js
```

## Pools toevoegen

Voeg een object toe aan `window.DIGIPOOLS` in `js/pools.js`. Pools met dezelfde `plaats` delen één markering, die het aantal toont.
