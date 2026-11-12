// <digipool-kaart>: de kaart van Nederland met een markering per locatie.
//
// Een eigen component (geen nldd-*): het designsysteem heeft geen kaart.
// Tekent de provinciegrenzen uit window.KAART_NEDERLAND en een markering per
// groep pools op dezelfde plaats. Staan er meer pools op één plek, dan toont
// de markering het aantal.
//
// API
//   kaart.pools = [...]      de pools die nu getoond worden
//   event 'locatie-kies'     detail: { plaats, pools } bij klik of Enter/spatie

(function () {
  const SVG = 'http://www.w3.org/2000/svg';
  // Speldvorm, punt op (0,0), ongeveer 24 breed en 34 hoog.
  const SPELD = 'M0,0 C-3,-9 -12,-14 -12,-22 A12,12 0 1 1 12,-22 C12,-14 3,-9 0,0Z';

  function el(naam, attrs) {
    const node = document.createElementNS(SVG, naam);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    return node;
  }

  class DigipoolKaart extends HTMLElement {
    constructor() {
      super();
      this._pools = [];
    }

    connectedCallback() {
      if (this._svg) return;
      const kaart = window.KAART_NEDERLAND;
      this._svg = el('svg', {
        viewBox: kaart.viewBox.join(' '),
        role: 'group',
        'aria-label': 'Kaart van Nederland met de locaties van de pools',
      });

      const land = el('g', { class: 'digipool-kaart__land', 'aria-hidden': 'true' });
      for (const p of kaart.provincies) {
        const pad = el('path', { d: p.d });
        const titel = el('title');
        titel.textContent = p.naam;
        pad.append(titel);
        land.append(pad);
      }
      this._markeringen = el('g', { class: 'digipool-kaart__markeringen' });
      this._svg.append(land, this._markeringen);
      this.append(this._svg);
      this._teken();

      // Centreer de kaart in het browservenster in plaats van in de kolom ernaast.
      const centreer = () => this._centreer();
      this._observer = new ResizeObserver(centreer);
      this._observer.observe(this);
      window.addEventListener('resize', centreer);
      requestAnimationFrame(centreer);
    }

    // Schuift de getekende kaart naar het midden van het venster, maar nooit
    // buiten het eigen vak: dan zou hij over de filters heen vallen.
    _centreer() {
      if (!this._svg) return;
      const vak = this.getBoundingClientRect();
      const [, , vbBreedte, vbHoogte] = window.KAART_NEDERLAND.viewBox;
      const hoogte = this._svg.getBoundingClientRect().height;
      const getekend = Math.min(vak.width, hoogte * (vbBreedte / vbHoogte));
      const speling = (vak.width - getekend) / 2;
      const verschuiving = document.documentElement.clientWidth / 2 - (vak.left + vak.width / 2);
      const x = Math.max(-speling, Math.min(speling, verschuiving));
      this._svg.style.transform = Math.abs(x) < 1 ? '' : `translateX(${x.toFixed(1)}px)`;
    }

    set pools(waarde) {
      this._pools = waarde || [];
      this._teken();
    }

    get pools() {
      return this._pools;
    }

    _projecteer(lon, lat) {
      const p = window.KAART_NEDERLAND.projectie;
      return [(lon - p.lon0) * p.cos * p.schaal, (p.lat0 - lat) * p.schaal];
    }

    _teken() {
      if (!this._markeringen) return;
      this._markeringen.replaceChildren();

      // Groepeer per plaats.
      const groepen = new Map();
      for (const pool of this._pools) {
        if (!groepen.has(pool.plaats)) groepen.set(pool.plaats, []);
        groepen.get(pool.plaats).push(pool);
      }

      // Van noord naar zuid tekenen, zodat zuidelijke spelden er bovenop liggen.
      const gesorteerd = [...groepen.entries()].sort((a, b) => b[1][0].lat - a[1][0].lat);
      // De kaart is ~2400 eenheden breed; de speld schaalt mee.
      const schaal = 4;

      for (const [plaats, pools] of gesorteerd) {
        const [x, y] = this._projecteer(pools[0].lon, pools[0].lat);
        const label = pools.length === 1
          ? `${plaats}: ${pools[0].naam}`
          : `${plaats}: ${pools.length} pools`;

        const g = el('g', {
          class: 'digipool-kaart__markering',
          transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${schaal})`,
          role: 'button',
          tabindex: '0',
          'aria-label': label,
        });
        const titel = el('title');
        titel.textContent = label;
        g.append(
          titel,
          el('path', { class: 'digipool-kaart__speld', d: SPELD }),
          el('circle', { class: 'digipool-kaart__kern', cx: 0, cy: -22, r: 5 }),
        );

        if (pools.length > 1) {
          g.append(
            el('circle', { class: 'digipool-kaart__aantal-bol', cx: 0, cy: -46, r: 11 }),
          );
          const tekst = el('text', { class: 'digipool-kaart__aantal', x: 0, y: -46 });
          tekst.textContent = String(pools.length);
          g.append(tekst);
        }

        const kies = () =>
          this.dispatchEvent(new CustomEvent('locatie-kies', { detail: { plaats, pools }, bubbles: true }));
        g.addEventListener('click', kies);
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            kies();
          }
        });
        this._markeringen.append(g);
      }
    }
  }

  customElements.define('digipool-kaart', DigipoolKaart);
})();
