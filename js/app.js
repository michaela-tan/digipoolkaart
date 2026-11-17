// Filterlogica van de Digipoolkaart.
//
// Binnen een filtergroep is het "of" (Gemeente of Provincies), tussen groepen
// "en" (organisatie én vakgebied én zoekterm). De kaart, de lijst, het aantal
// en de filters zelf volgen allemaal uit dezelfde toestand.

(function () {
  const pools = window.DIGIPOOLS;

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
  const groepen = [
    { sleutel: 'organisaties', opties: window.ORGANISATIES, doel: '#filter-organisaties', label: 'Voor welke organisaties?' },
    { sleutel: 'vakgebieden', opties: window.VAKGEBIEDEN, doel: '#filter-vakgebieden', label: 'Vakgebied' },
  ];

  const telPools = (groep, optie) => pools.filter((p) => p[groep.sleutel].includes(optie)).length;

  for (const groep of groepen) {
    const knoppen = maak('nldd-toggle-button-group', {
      type: 'checkbox',
      size: 'sm',
      'accessible-label': groep.label,
      'data-groep': groep.sleutel,
    });
    for (const optie of groep.opties) {
      // Achter het label het aantal pools met deze waarde, bijv. "Rijksoverheid (1)".
      knoppen.append(maak('nldd-toggle-button', { text: `${optie} (${telPools(groep, optie)})`, value: optie }));
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

  const rijen = new Map();
  // Op alfabetische volgorde van de naam (Nederlands, zonder onderscheid tussen hoofd- en kleine letters).
  const opNaam = [...pools].sort((a, b) => a.naam.localeCompare(b.naam, 'nl', { sensitivity: 'base' }));
  for (const pool of opNaam) {
    // Een kaart per pool: de naam vet, rechts de plaats(en). De hele kaart is een knop.
    const plaatsKort = pool.locaties.length > 1
      ? `${pool.locaties[0].plaats} +${pool.locaties.length - 1}`
      : pool.locaties[0].plaats;
    const rij = maak('nldd-card', {
      button: true,
      background: 'accent-tinted',
      'accessible-label': `${pool.naam}, ${plaatsen(pool)}`,
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
    rij.addEventListener('click', () => {
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

  // ── Alle filters wissen ──────────────────────────────────────────────────────

  // Eén knop onder de filters en één in "Geen pools gevonden". Beide zetten de zoekterm
  // en alle filterlabels terug; de focus gaat naar het zoekveld, zodat toetsenbord- en
  // schermlezergebruikers bovenaan de filters verder kunnen.
  const wisFilters = $('#wis-filters');
  function wisAlles() {
    toestand.zoekterm = '';
    toestand.organisaties.clear();
    toestand.vakgebieden.clear();
    zoeken.value = '';
    for (const knop of document.querySelectorAll('nldd-toggle-button[selected]')) {
      knop.removeAttribute('selected');
    }
    werkBij();
    zoeken.focus();
  }
  for (const knop of document.querySelectorAll('.wis-filters')) {
    knop.addEventListener('click', wisAlles);
  }

  // ── Alles bijwerken ──────────────────────────────────────────────────────────

  function werkBij() {
    const zichtbaar = pools.filter(past);
    const ids = new Set(zichtbaar.map((p) => p.id));
    for (const [id, rij] of rijen) rij.hidden = !ids.has(id);
    geenResultaten.hidden = zichtbaar.length > 0;
    wisFilters.hidden = !isGefilterd();

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
    if (metTitel) {
      blok.push(
        maak('nldd-title', { text: pool.naam, 'heading-level': '3', size: 'display-5', color: 'inherit' }),
        maak('nldd-spacer', { size: '8' }),
      );
    }
    if (pool.omschrijving) blok.push(tekst(pool.omschrijving), maak('nldd-spacer', { size: '16' }));
    if (pool.vakgebieden.length) {
      blok.push(
        maak(
          'nldd-container',
          { layout: 'wrap', gap: '8' },
          pool.vakgebieden.map((v) => maak('nldd-tag', { text: v, color: 'paars' })),
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
    if (pool.contactpagina) contact.push(maak('nldd-link', { href: pool.contactpagina, text: 'Contactpagina', size: 'sm' }));
    if (pool.telefoon) contact.push(tekst(pool.telefoon));

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

  // Eén pool: de naam staat in de titelbalk. Meer pools op één plaats: de plaats
  // in de titelbalk en per pool een eigen kop, gescheiden door een lijn.
  function toonDetails(titel, lijstVanPools) {
    const n = lijstVanPools.length;
    const enkel = n === 1;
    const kop = enkel ? lijstVanPools[0].naam : titel;
    const onder = enkel ? plaatsen(lijstVanPools[0]) : `${n} pools`;
    vensterTitel.setAttribute('text', kop);
    vensterTitel.setAttribute('supporting-text', onder);
    vensterKop.setAttribute('text', kop);
    vensterKop.setAttribute('supporting-text', onder);

    const blokken = [];
    lijstVanPools.forEach((pool, i) => {
      if (i === 0 && !enkel) blokken.push(maak('nldd-spacer', { size: '16' }));
      if (i > 0) {
        blokken.push(
          maak('nldd-spacer', { size: '32' }),
          maak('nldd-divider'),
          maak('nldd-spacer', { size: '32' }),
        );
      }
      blokken.push(...poolBlok(pool, !enkel));
    });
    vensterInhoud.replaceChildren(...blokken);
    venster.open = true;
  }

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
