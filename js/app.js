// Filterlogica van de Digipoolkaart.
//
// Binnen een filtergroep is het "of" (Gemeente of Provincies), tussen groepen
// "en" (organisatie én vakgebied én zoekterm). De kaart, de lijst, het aantal
// en de tokens met actieve filters volgen allemaal uit dezelfde toestand.

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
  const aantal = $('#aantal');
  const zoeken = $('#zoeken');
  const strip = $('#actieve-filters');
  const stripRuimte = $('#actieve-filters-ruimte');
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

  const groepen = [
    { sleutel: 'organisaties', opties: window.ORGANISATIES, doel: '#filter-organisaties', label: 'Voor welke organisaties?', kort: 'Organisatie' },
    { sleutel: 'vakgebieden', opties: window.VAKGEBIEDEN, doel: '#filter-vakgebieden', label: 'Vakgebied', kort: 'Vakgebied' },
  ];

  for (const groep of groepen) {
    const knoppen = maak('nldd-toggle-button-group', {
      type: 'checkbox',
      size: 'sm',
      'accessible-label': groep.label,
      'data-groep': groep.sleutel,
    });
    for (const optie of groep.opties) {
      knoppen.append(maak('nldd-toggle-button', { text: optie, value: optie }));
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

  function zetKnop(sleutel, waarde, aan) {
    const knop = document.querySelector(
      `nldd-toggle-button-group[data-groep="${sleutel}"] nldd-toggle-button[value="${CSS.escape(waarde)}"]`,
    );
    if (knop) knop.toggleAttribute('selected', aan);
  }

  // ── Zoeken ───────────────────────────────────────────────────────────────────

  function opZoeken(e) {
    toestand.zoekterm = (e.detail?.value ?? e.target?.value ?? '').trim();
    werkBij();
  }
  zoeken.addEventListener('input', opZoeken);
  zoeken.addEventListener('search', opZoeken);

  // ── Filteren ─────────────────────────────────────────────────────────────────

  function past(pool) {
    const { zoekterm, organisaties, vakgebieden } = toestand;
    if (organisaties.size && !pool.organisaties.some((o) => organisaties.has(o))) return false;
    if (vakgebieden.size && !pool.vakgebieden.some((v) => vakgebieden.has(v))) return false;
    if (zoekterm) {
      const hooiberg = [pool.naam, pool.organisatie, pool.plaats].join(' ').toLocaleLowerCase('nl');
      if (!hooiberg.includes(zoekterm.toLocaleLowerCase('nl'))) return false;
    }
    return true;
  }

  function isGefilterd() {
    return Boolean(toestand.zoekterm || toestand.organisaties.size || toestand.vakgebieden.size);
  }

  // ── Lijst ────────────────────────────────────────────────────────────────────

  const rijen = new Map();
  for (const pool of pools) {
    const rij = maak('nldd-list-item', { button: true, 'data-id': pool.id }, [
      maak('nldd-text-cell', {
        text: pool.naam,
        'supporting-text': `${pool.organisatie} · ${pool.plaats}`,
      }),
      maak('nldd-spacer-cell', { size: '12' }),
      maak('nldd-icon-cell', { size: '20', color: 'secondary', icon: 'chevron-right' }),
    ]);
    rij.addEventListener('click', () => toonDetails(pool.naam, [pool]));
    rijen.set(pool.id, rij);
    lijst.append(rij);
  }

  // ── Tokens met actieve filters ───────────────────────────────────────────────

  function tekenTokens() {
    const tokens = [];
    if (toestand.zoekterm) {
      tokens.push({
        tekst: `Zoeken: ${toestand.zoekterm}`,
        wis: () => {
          toestand.zoekterm = '';
          zoeken.value = '';
        },
      });
    }
    for (const groep of groepen) {
      for (const waarde of toestand[groep.sleutel]) {
        tokens.push({
          tekst: `${groep.kort}: ${waarde}`,
          wis: () => {
            toestand[groep.sleutel].delete(waarde);
            zetKnop(groep.sleutel, waarde, false);
          },
        });
      }
    }

    strip.replaceChildren(
      ...tokens.map(({ tekst, wis }) => {
        const token = maak('nldd-token', { text: tekst, control: 'dismiss' });
        token.addEventListener('dismiss', () => {
          wis();
          werkBij();
          // Focus niet laten wegvallen: terug naar het zoekveld.
          zoeken.focus();
        });
        return token;
      }),
    );
    // De strip en de ruimte erboven bestaan alleen zolang er filters zijn.
    strip.hidden = tokens.length === 0;
    stripRuimte.hidden = tokens.length === 0;
  }

  // ── Alles bijwerken ──────────────────────────────────────────────────────────

  function werkBij() {
    const zichtbaar = pools.filter(past);
    const ids = new Set(zichtbaar.map((p) => p.id));
    for (const [id, rij] of rijen) rij.hidden = !ids.has(id);

    kaart.pools = zichtbaar;
    tekenTokens();

    aantal.textContent = isGefilterd()
      ? `${zichtbaar.length} van ${pools.length} pools`
      : `${pools.length} pools`;
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
    blok.push(
      tekst(pool.omschrijving),
      maak('nldd-spacer', { size: '16' }),
      maak(
        'nldd-container',
        { layout: 'wrap', gap: '8' },
        pool.vakgebieden.map((v) => maak('nldd-tag', { text: v, color: 'paars' })),
      ),
      maak('nldd-spacer', { size: '16' }),
      maak('nldd-divider'),
      maak('nldd-spacer', { size: '16' }),
    );

    const rijen = [
      ['Organisatie', pool.organisatie],
      ['Vakgebied', pool.expertise],
      ['Omvang', pool.omvang],
      ['Doelgroep', pool.doelgroep],
      ['Governance', pool.governance],
      ['Financiering', pool.financiering],
    ].filter(([, waarde]) => waarde);
    const contact = [
      maak('nldd-link', { href: `mailto:${pool.contact}`, text: pool.contact, size: 'sm' }),
    ];
    if (pool.telefoon) contact.push(tekst(pool.telefoon));

    blok.push(
      maak('nldd-container', { gap: '16' }, [
        ...rijen.map(([label, waarde]) => gegeven(label, tekst(waarde))),
        gegeven('Contact', ...contact),
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
    const plaats = lijstVanPools[0].plaats;
    const enkel = n === 1;
    const kop = enkel ? lijstVanPools[0].naam : titel;
    const onder = enkel ? plaats : `${n} pools`;
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

  kaart.addEventListener('locatie-kies', (e) => {
    const { plaats, pools: opLocatie } = e.detail;
    toonDetails(plaats, opLocatie);
  });

  werkBij();
})();
