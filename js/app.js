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
  const sectie = $('nldd-sidebar-section');
  const sheet = $('#details');
  const sheetTitel = $('#details-titel');
  const sheetInhoud = $('#details-inhoud');

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

  // ── Knop naar de filters (alleen zichtbaar als de filters in een sheet zitten) ──

  $('#filters-knop').addEventListener('click', () => sectie.show());
  $('#filters-menu-item').addEventListener('select', () => sectie.show());

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

  // ── Details in een sheet ─────────────────────────────────────────────────────

  function toonDetails(titel, lijstVanPools) {
    const n = lijstVanPools.length;
    const plaats = lijstVanPools[0].plaats;
    sheetTitel.setAttribute('text', titel);
    sheetTitel.setAttribute(
      'supporting-text',
      titel !== plaats ? plaats : `${n} ${n === 1 ? 'pool' : 'pools'}`,
    );

    const blokken = [];
    lijstVanPools.forEach((pool, i) => {
      if (i > 0) blokken.push(maak('nldd-spacer', { size: '32' }));
      blokken.push(
        maak('nldd-title', {
          text: pool.naam,
          'supporting-text': pool.organisatie,
          'heading-level': '3',
          size: 'display-5',
        }),
        maak('nldd-spacer', { size: '8' }),
        maak('nldd-text', {}, [pool.omschrijving]),
        maak('nldd-spacer', { size: '12' }),
        maak(
          'nldd-container',
          { layout: 'wrap', gap: '4' },
          [
            ...pool.organisaties.map((o) => maak('nldd-tag', { text: o, size: 'sm', color: 'accent' })),
            ...pool.vakgebieden.map((v) => maak('nldd-tag', { text: v, size: 'sm', color: 'neutral' })),
          ],
        ),
        maak('nldd-spacer', { size: '12' }),
        maak('nldd-link', {
          href: `mailto:${pool.contact}`,
          'start-icon': 'envelope',
          text: pool.contact,
          size: 'sm',
        }),
      );
    });
    sheetInhoud.replaceChildren(...blokken);
    sheet.open = true;
  }

  kaart.addEventListener('locatie-kies', (e) => {
    const { plaats, pools: opLocatie } = e.detail;
    toonDetails(plaats, opLocatie);
  });

  werkBij();
})();
