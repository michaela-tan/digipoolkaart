# Digipoolkaart

Een kaart van Nederland met de digitaliseringspools binnen de overheid, met zoeken en filteren op organisatie en vakgebied. Gebouwd met het [NLDD Designsysteem](https://nederlandsedigitaledienst.github.io/design-system/) (`@nldd/design-system` 0.22.0).

## Bekijken

De pagina laadt zijn gegevens uit `data/*.json`, en dat kan niet direct vanaf schijf. Start daarom een kleine webserver in deze map:

```bash
python3 -m http.server 8000
```

en open http://localhost:8000. Er is geen build nodig: de NLDD-componenten komen van jsDelivr en de eigen scripts zijn gewone `<script>`-bestanden.

## Beheer

Op `/admin/` staat een beheeromgeving ([Sveltia CMS](https://sveltiacms.app/)) waarin collega's zonder technische kennis de pools, plaatsen, filterlabels en paginateksten aanpassen. Opslaan maakt een commit op `main`; GitHub Pages zet die daarna live. De handleiding voor beheerders staat in [BEHEER.md](BEHEER.md).

- **Toegang geven:** Settings › Collaborators › Add people, met de GitHub-gebruikersnaam van de collega.
- **Inloggen** gaat met een persoonlijk toegangstoken (classic, scope `repo`). Een knop "Inloggen met GitHub" kan erbij met een eigen inlogdienst, zoals [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) op Cloudflare Workers: zet dan `base_url` en `auth_methods: [oauth, token]` in `admin/config.yml`.
- **Velden en bestanden** staan in `admin/config.yml`. Een nieuw veld in een pool moet daar en in `js/app.js` (het venster) worden toegevoegd.
- **Versie:** `admin/index.html` laadt een vaste versie van Sveltia CMS. Verhoog die af en toe en test het inloggen daarna.
- **Lokaal werken:** haal eerst de wijzigingen uit het beheer op met `git pull`, anders botst je commit met die van een beheerder.

## Opbouw

| Bestand | Wat |
|---|---|
| `index.html` | De pagina: `nldd-shell` › `nldd-page` › `nldd-sidebar-section` volgens het NLDD-patroon "Filteren" |
| `data/pools.json` | De pools, een object per pool |
| `data/plaatsen.json` | De plaatsen op de kaart, met hun plek als GeoJSON-punt |
| `data/filters.json` | De filterlabels; pools verwijzen ernaar met hun `id` |
| `data/teksten.json` | De teksten op de pagina (titel, subtitel, kopjes) |
| `admin/` | De beheeromgeving: `index.html` laadt Sveltia CMS, `config.yml` beschrijft de velden |
| `js/app.js` | Laadt de gegevens en zet de teksten; filterlogica: zoeken, filters (lijst met vinkjes en filterlabels), lijst en detailvenster (`nldd-window`) |
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

Het makkelijkst via de beheeromgeving (zie [BEHEER.md](BEHEER.md)). Rechtstreeks in de bestanden kan ook:

- Een pool is een object in `data/pools.json`. `plaatsen`, `organisaties` en `vakgebieden` zijn lijsten met de `id` van een plaats of filterlabel. Velden: `naam`, `organisatie`, `omschrijving` (Dienstverlening), `expertise` (Vakgebied), `omvang`, `doelgroep`, `governance`, `financiering`, `email`, `telefoon`, `contactpagina`, `website` en `contactpersonen` (`[{ naam, rol, email, telefoon }]`). Een veld dat leeg is of ontbreekt, verschijnt niet in het detailvenster.
- Een nieuwe plaats komt in `data/plaatsen.json`, met `locatie` als `{"type":"Point","coordinates":[lengtegraad,breedtegraad]}`. Plaatsen op precies hetzelfde punt delen één markering.
- De filters staan niet in de Excel, behalve de kolom "Voor welke organisaties". Kies ze per pool uit `data/filters.json`.
