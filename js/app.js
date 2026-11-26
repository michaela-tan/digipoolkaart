// Filterlogica van de Digipoolkaart.
//
// Binnen een filtergroep is het "of" (Gemeente of Provincies), tussen groepen
// "en" (organisatie én vakgebied én zoekterm). De kaart, de lijst, het aantal
// en de filters zelf volgen allemaal uit dezelfde toestand.
//
// De gegevens staan in data/*.json en zijn aan te passen op /admin/ (zie admin/config.yml).

// Eén databestand ophalen. no-cache: de browser vraagt steeds of er een nieuwere versie is,
// zodat een wijziging uit het beheer niet blijft hangen.
async function laadJson(pad) {
  const antwoord = await fetch(pad, { cache: 'no-cache' });
  if (!antwoord.ok) throw new Error(`${pad}: ${antwoord.status}`);
  return antwoord.json();
}

// Zet de bestanden om naar wat de pagina gebruikt. Een pool verwijst naar plaatsen en
// filterlabels met hun id; hier worden dat plaatsen met coördinaten.
async function laadGegevens() {
  const [ruwePools, teksten, filters, { plaatsen = [] }] = await Promise.all([
    laadJson('data/pools.json'),
    laadJson('data/teksten.json'),
    laadJson('data/filters.json'),
    laadJson('data/plaatsen.json'),
  ]);

  // Een plaats bewaart zijn plek als GeoJSON-punt, [lengtegraad, breedtegraad].
  // Een plaats zonder (geldige) plek slaat de kaart over.
  const plaatsPerId = new Map();
  for (const p of plaatsen) {
    try {
      const [lon, lat] = JSON.parse(p.locatie).coordinates;
      if (Number.isFinite(lat) && Number.isFinite(lon)) plaatsPerId.set(p.id, { plaats: p.naam, lat, lon });
    } catch {
      // Geen of een onleesbare plek: niet op de kaart.
    }
  }

  const pools = ruwePools
    .filter((p) => p && p.naam)
    .map((p, i) => ({
      ...p,
      id: `pool-${i}`,
      locaties: (p.plaatsen ?? []).map((id) => plaatsPerId.get(id)).filter(Boolean),
      organisaties: p.organisaties ?? [],
      vakgebieden: p.vakgebieden ?? [],
      contactpersonen: (p.contactpersonen ?? []).filter((c) => c && c.naam),
    }));

  return {
    pools,
    teksten,
    organisaties: (filters.organisaties ?? []).filter((o) => o.id && o.naam),
    vakgebieden: (filters.vakgebieden ?? []).filter((v) => v.id && v.naam),
  };
}

// Teksten uit het beheer op de pagina zetten. Een leeg veld laat de tekst uit index.html staan.
function zetTeksten(teksten) {
  const zet = (selector, attribuut, waarde) => {
    const el = document.querySelector(selector);
    if (el && waarde) el.setAttribute(attribuut, waarde);
  };
  if (teksten.paginatitel) document.title = teksten.paginatitel;
  zet('#beschrijving', 'content', teksten.subtitel);
  zet('#kop-titel', 'text', teksten.titel);
  if (teksten.subtitel) document.querySelector('#kop-subtitel').textContent = teksten.subtitel;
  zet('#kop-zoeken', 'text', teksten.kopZoeken);
  zet('#zoeken', 'placeholder', teksten.zoekveldVoorbeeld);
  zet('#kop-organisaties', 'text', teksten.kopOrganisaties);
  zet('#kop-vakgebieden', 'text', teksten.kopVakgebieden);
}

(async function () {
  let gegevens;
  try {
    gegevens = await laadGegevens();
  } catch (fout) {
    console.error('Gegevens niet geladen:', fout);
    document.querySelector('#laadfout').hidden = false;
    return;
  }
  const { pools, teksten } = gegevens;
  zetTeksten(teksten);

  // De naam van een filterlabel bij zijn id, voor de labels in het venster.
  const naamVan = new Map([...gegevens.organisaties, ...gegevens.vakgebieden].map((o) => [o.id, o.naam]));

  const toestand = {
    zoekterm: '',
    organisaties: new Set(),
    vakgebieden: new Set(),
  };

  const $ = (sel) => document.querySelector(sel);
  const kaart = $('#kaart');
  const lijst = $('#resultaten');
  const geenResultaten = $('#geen-resultaten');
  const aantal = $('#aantal');
  const zoeken = $('#zoeken');
  const venster = $('#details');
  const vensterTitel = $('#details-titel');
  const vensterKop = $('#details-kop');
  const vensterInhoud = $('#details-inhoud');

  function maak(tag, attrs = {}, kinderen = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === true) node.setAttribute(k, '');
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    node.append(...kinderen);
    return node;
  }

  // ── Filterknoppen ────────────────────────────────────────────────────────────

  // Beide groepen als filterlabels (toggle buttons), met het aantal pools erachter.
  // Een optie is { id, naam }: het label toont de naam, de pools verwijzen naar de id.
  const groepen = [
    {
      sleutel: 'organisaties',
      opties: gegevens.organisaties,
      doel: '#filter-organisaties',
      label: teksten.kopOrganisaties || 'Voor welke organisaties?',
    },
    {
      sleutel: 'vakgebieden',
      opties: gegevens.vakgebieden,
      doel: '#filter-vakgebieden',
      label: teksten.kopVakgebieden || 'Vakgebied',
    },
  ];

  const telPools = (groep, optie) => pools.filter((p) => p[groep.sleutel].includes(optie.id)).length;

  for (const groep of groepen) {
    const knoppen = maak('nldd-toggle-button-group', {
      type: 'checkbox',
      size: 'sm',
      'accessible-label': groep.label,
      'data-groep': groep.sleutel,
    });
    for (const optie of groep.opties) {
      // Achter het label het aantal pools met deze waarde, bijv. "Rijksoverheid (1)".
      knoppen.append(maak('nldd-toggle-button', { text: `${optie.naam} (${telPools(groep, optie)})`, value: optie.id }));
    }
    knoppen.addEventListener('change', (e) => {
      const knop = e.target.closest('nldd-toggle-button');
      const waarde = e.detail?.value ?? knop?.value;
      const aan = e.detail?.selected ?? knop?.selected;
      if (!waarde) return;
      if (aan) toestand[groep.sleutel].add(waarde);
      else toestand[groep.sleutel].delete(waarde);
      werkBij();
    });
    $(groep.doel).append(knoppen);
  }

  // "Selecties wissen": zet alle filterlabels uit. De zoekterm blijft staan.
  // De knop verdwijnt dan, dus de focus gaat naar de knop "Toon lijst" eronder.
  const wisBlok = $('#wis-blok');
  $('#wis-filters').addEventListener('click', () => {
    for (const knop of document.querySelectorAll('[data-groep] nldd-toggle-button')) knop.selected = false;
    toestand.organisaties.clear();
    toestand.vakgebieden.clear();
    werkBij();
    $('#toon-lijst').focus();
  });

  // ── Zoeken ───────────────────────────────────────────────────────────────────

  function opZoeken(e) {
    toestand.zoekterm = (e.detail?.value ?? e.target?.value ?? '').trim();
    werkBij();
  }
  zoeken.addEventListener('input', opZoeken);
  zoeken.addEventListener('search', opZoeken);

  // Alle plaatsen van een pool, voor de lijst, het zoeken en het venster.
  function plaatsen(pool) {
    return pool.locaties.map((l) => l.plaats).join(', ');
  }

  // ── Filteren ─────────────────────────────────────────────────────────────────

  function past(pool) {
    const { zoekterm, organisaties, vakgebieden } = toestand;
    if (organisaties.size && !pool.organisaties.some((o) => organisaties.has(o))) return false;
    if (vakgebieden.size && !pool.vakgebieden.some((v) => vakgebieden.has(v))) return false;
    if (zoekterm) {
      const hooiberg = [pool.naam, pool.organisatie, plaatsen(pool)].join(' ').toLocaleLowerCase('nl');
      if (!hooiberg.includes(zoekterm.toLocaleLowerCase('nl'))) return false;
    }
    return true;
  }

  function isGefilterd() {
    return Boolean(toestand.zoekterm || toestand.organisaties.size || toestand.vakgebieden.size);
  }

  // ── Lijst ────────────────────────────────────────────────────────────────────

  // Op alfabetische volgorde van de naam (Nederlands, zonder onderscheid tussen hoofd- en kleine letters).
  const opNaam = (lijstVanPools) =>
    [...lijstVanPools].sort((a, b) => a.naam.localeCompare(b.naam, 'nl', { sensitivity: 'base' }));

  // Een kaart per pool: de naam vet, rechts de plaats(en). De hele kaart is een knop.
  // Gebruikt in het poolsoverzicht en in het venster van een speld met meer pools.
  function poolkaart(pool, opKlik) {
    // Zonder plaats (nog geen gegevens) blijft de rechterkant leeg.
    const plaatsKort = pool.locaties.length > 1
      ? `${pool.locaties[0].plaats} +${pool.locaties.length - 1}`
      : pool.locaties[0]?.plaats ?? '';
    const kaartje = maak('nldd-card', {
      button: true,
      background: 'accent-tinted',
      'accessible-label': pool.locaties.length ? `${pool.naam}, ${plaatsen(pool)}` : pool.naam,
      'data-id': pool.id,
    }, [
      maak('nldd-container', { layout: 'row', gap: '12', padding: '12', 'padding-inline': '16', 'vertical-alignment': 'center' }, [
        maak('nldd-container', {}, [
          maak('nldd-text', { size: 'sm', weight: 'bold' }, [pool.naam]),
        ]),
        maak('nldd-container', { width: 'fit-content', 'min-width': 'max-content' }, [
          // Eén plaats, of de eerste plus het aantal andere: "Gouda +2". Zo blijft de naam leesbaar.
          maak('nldd-text', { size: 'sm', color: 'secondary' }, [plaatsKort]),
        ]),
      ]),
    ]);
    kaartje.addEventListener('click', opKlik);
    return kaartje;
  }

  const rijen = new Map();
  for (const pool of opNaam(pools)) {
    const rij = poolkaart(pool, () => {
      toonDetails(pool.naam, [pool]);
      kies(pool.id);
    });
    rijen.set(pool.id, rij);
    lijst.append(rij);
  }

  // ── Lijst tonen of verbergen ─────────────────────────────────────────────────

  const toonLijst = $('#toon-lijst');
  const lijstpaneel = $('#lijstpaneel');
  // De knop noemt altijd hoeveel pools er na het filteren over zijn: "Toon lijst (9)".
  function zetKnoptekst(aantalOver) {
    const woord = lijstpaneel.hidden ? 'Toon lijst' : 'Verberg lijst';
    toonLijst.setAttribute('text', `${woord} (${aantalOver})`);
  }
  function zetLijst(open) {
    lijstpaneel.hidden = !open;
    toonLijst.toggleAttribute('expanded', open);
    zetKnoptekst(pools.filter(past).length);
  }
  toonLijst.addEventListener('click', () => zetLijst(lijstpaneel.hidden));
  // "Sluit" in het lijstpaneel; de focus gaat terug naar de knop die de lijst opende.
  $('#sluit-lijst').addEventListener('click', () => {
    zetLijst(false);
    toonLijst.focus();
  });

  // ── Alles bijwerken ──────────────────────────────────────────────────────────

  function werkBij() {
    const zichtbaar = pools.filter(past);
    const ids = new Set(zichtbaar.map((p) => p.id));
    for (const [id, rij] of rijen) rij.hidden = !ids.has(id);
    geenResultaten.hidden = zichtbaar.length > 0;
    wisBlok.hidden = !(toestand.organisaties.size || toestand.vakgebieden.size);

    kaart.pools = zichtbaar;
    zetKnoptekst(zichtbaar.length);

    aantal.setAttribute('text', isGefilterd()
      ? `${zichtbaar.length} van ${pools.length} pools`
      : `Alle ${pools.length} pools`);
  }

  // ── Details in een venster───────────────────────────────────────────────────

  // Eén gegeven als rij: label links (vaste breedte), waarde rechts.
  function gegeven(label, ...waarde) {
    return maak('nldd-container', { layout: 'row', gap: '16' }, [
      maak('nldd-container', { width: '128px' }, [
        maak('nldd-text', { size: 'sm', weight: 'bold', color: 'inherit' }, [label]),
      ]),
      maak('nldd-container', {}, waarde),
    ]);
  }

  function tekst(waarde) {
    return maak('nldd-text', { size: 'sm', color: 'inherit' }, [waarde]);
  }

  // De inhoud van één pool, zoals in het ontwerp: omschrijving, vakgebieden,
  // een scheidingslijn, de gegevens en een knop naar de website.
  function poolBlok(pool, metTitel) {
    const blok = [];
    // Een nieuwe pool waarvan alleen de naam bekend is: dan alleen een korte melding.
    const heeftGegevens = ['omschrijving', 'organisatie', 'expertise', 'omvang', 'doelgroep', 'governance',
      'financiering', 'email', 'telefoon', 'contactpagina', 'website'].some((veld) => pool[veld])
      || pool.contactpersonen.length > 0;
    if (!heeftGegevens) {
      return [
        maak('nldd-inline-dialog', {
          icon: 'info',
          text: 'Nog geen gegevens',
          'supporting-text': 'Van deze pool zijn nog geen gegevens bekend.',
        }),
      ];
    }
    if (metTitel) {
      blok.push(
        maak('nldd-title', { text: pool.naam, 'heading-level': '3', size: 'display-5', color: 'inherit' }),
        maak('nldd-spacer', { size: '8' }),
      );
    }
    if (pool.omschrijving) blok.push(tekst(pool.omschrijving), maak('nldd-spacer', { size: '16' }));
    // Alleen labels die nog bestaan: een verwijderd filterlabel verdwijnt hier ook.
    const vakgebieden = pool.vakgebieden.map((id) => naamVan.get(id)).filter(Boolean);
    if (vakgebieden.length) {
      blok.push(
        maak(
          'nldd-container',
          { layout: 'wrap', gap: '8' },
          vakgebieden.map((v) => maak('nldd-tag', { text: v, color: 'paars' })),
        ),
        maak('nldd-spacer', { size: '16' }),
      );
    }
    blok.push(maak('nldd-divider'), maak('nldd-spacer', { size: '16' }));

    const rijen = [
      ['Organisatie', pool.organisatie],
      ['Vakgebied', pool.expertise],
      ['Omvang', pool.omvang],
      ['Doelgroep', pool.doelgroep],
      ['Governance', pool.governance],
      ['Financiering', pool.financiering],
    ].filter(([, waarde]) => waarde);
    const contact = [];
    if (pool.email) contact.push(maak('nldd-link', { href: `mailto:${pool.email}`, text: pool.email, size: 'sm' }));
    // Een externe site: opent in een nieuw tabblad, zodat de Digipoolkaart open blijft.
    // nldd-link meldt dat zelf aan schermlezers; het icoon laat het ook zien.
    if (pool.contactpagina) {
      contact.push(maak('nldd-link', {
        href: pool.contactpagina,
        target: '_blank',
        text: 'Contactpagina',
        'end-icon': 'external-link',
        size: 'sm',
      }));
    }
    if (pool.telefoon) contact.push(tekst(pool.telefoon));
    // Contactpersonen onder de algemene gegevens: naam en rol, e-mail, telefoon.
    for (const persoon of pool.contactpersonen) {
      if (contact.length) contact.push(maak('nldd-spacer', { size: '8' }));
      contact.push(tekst(persoon.rol ? `${persoon.naam}, ${persoon.rol}` : persoon.naam));
      if (persoon.email) contact.push(maak('nldd-link', { href: `mailto:${persoon.email}`, text: persoon.email, size: 'sm' }));
      if (persoon.telefoon) contact.push(tekst(persoon.telefoon));
    }

    blok.push(
      maak('nldd-container', { gap: '16' }, [
        ...rijen.map(([label, waarde]) => gegeven(label, tekst(waarde))),
        ...(contact.length ? [gegeven('Contact', ...contact)] : []),
      ]),
    );

    if (pool.website) {
      blok.push(
        maak('nldd-spacer', { size: '24' }),
        // Zelfde opbouw als een gegeven, met een lege labelkolom: de knop lijnt uit met de waarden.
        maak('nldd-container', { layout: 'row', gap: '16' }, [
          maak('nldd-container', { width: '128px' }),
          maak('nldd-container', {}, [
            maak('nldd-button', {
              href: pool.website,
              target: '_blank',
              text: 'Naar website',
              'end-icon': 'external-link',
              appearance: 'primary',
            }),
          ]),
        ]),
      );
    }
    return blok;
  }

  // Waar de terugknop in de titelbalk heen gaat: de lijst van de speld waar de
  // gebruiker vandaan kwam. null: geen terugknop.
  let terugNaar = null;

  // Eén pool: de naam staat in de titelbalk, eronder alle gegevens.
  // Meer pools op één plaats: de plaats in de titelbalk en de pools als lijst met
  // kaarten, zoals het poolsoverzicht. Een klik op een kaart toont die pool, met
  // een terugknop naar de lijst.
  function toonDetails(titel, lijstVanPools, vanuit = null) {
    const n = lijstVanPools.length;
    const enkel = n === 1;
    const kop = enkel ? lijstVanPools[0].naam : titel;
    const onder = enkel ? plaatsen(lijstVanPools[0]) : `${n} pools`;
    vensterTitel.setAttribute('text', kop);
    vensterKop.setAttribute('text', kop);
    // Een pool zonder plaats heeft geen tekst onder de titel.
    for (const el of [vensterTitel, vensterKop]) {
      if (onder) el.setAttribute('supporting-text', onder);
      else el.removeAttribute('supporting-text');
    }

    terugNaar = vanuit;
    if (vanuit) vensterTitel.setAttribute('back-text', vanuit.titel);
    else vensterTitel.removeAttribute('back-text');

    if (enkel) {
      vensterInhoud.replaceChildren(...poolBlok(lijstVanPools[0], false));
    } else {
      const kaartjes = opNaam(lijstVanPools).map((pool) =>
        poolkaart(pool, () => {
          toonDetails(pool.naam, [pool], { titel, pools: lijstVanPools });
          kies(pool.id);
        }));
      vensterInhoud.replaceChildren(
        maak('nldd-spacer', { size: '8' }),
        maak('digipool-poolkaarten', {}, [maak('nldd-container', { gap: '8' }, kaartjes)]),
      );
    }
    venster.open = true;
  }

  // Terugknop in de titelbalk: weer de lijst van de speld.
  vensterTitel.addEventListener('back', () => {
    if (!terugNaar) return;
    const { titel, pools: vorige } = terugNaar;
    kies(null);
    toonDetails(titel, vorige);
  });

  // Gekozen pool uit het overzicht: die kaart in de lijst krijgt een andere kleur
  // (data-gekozen, zie css/digipool-kop.css) en op de kaart staan alleen zijn spelden.
  // null: alles weer zoals het was.
  function kies(id) {
    for (const [poolId, rij] of rijen) rij.toggleAttribute('data-gekozen', poolId === id);
    kaart.gekozen = id ? { pool: id } : null;
  }

  // Venster dicht: niets meer gekozen.
  venster.addEventListener('close', () => kies(null));

  kaart.addEventListener('locatie-kies', (e) => {
    const { plaats, pools: opLocatie } = e.detail;
    toonDetails(plaats, opLocatie);
  });

  werkBij();
})();
