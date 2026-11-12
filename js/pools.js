// Voorbeelddata voor de Digipoolkaart.
// LET OP: de pools, namen en contactgegevens hieronder zijn fictief.
// Vervang ze door de echte gegevens (of laad ze uit een API) voordat de kaart live gaat.
//
// Per pool:
//   organisaties: een of meer van ORGANISATIES
//   vakgebieden:  een of meer van VAKGEBIEDEN
//   plaats, lat, lon: de locatie op de kaart. Pools met dezelfde plaats delen één markering.

window.ORGANISATIES = ['Gemeente', 'Provincies', 'Waterschappen', 'Rijksoverheid', 'Overheidsbreed'];
window.VAKGEBIEDEN = ['Data', 'AI', 'Software', 'Security', 'Architectuur', 'Beheer', 'Informatie', 'Projecten'];

window.DIGIPOOLS = [
  {
    id: 'rijks-datapool',
    naam: 'Rijksbrede Datapool',
    organisatie: 'Ministerie van Voorbeeldzaken',
    plaats: 'Den Haag', lat: 52.0799, lon: 4.3113,
    organisaties: ['Rijksoverheid'],
    vakgebieden: ['Data', 'AI'],
    omschrijving: 'Data-analisten en data scientists die tijdelijk aansluiten bij een project van een ministerie of uitvoeringsorganisatie.',
    contact: 'datapool@example.nl',
  },
  {
    id: 'ict-flexpool-rijk',
    naam: 'ICT Flexpool Rijk',
    organisatie: 'Ministerie van Voorbeeldzaken',
    plaats: 'Den Haag', lat: 52.0799, lon: 4.3113,
    organisaties: ['Rijksoverheid'],
    vakgebieden: ['Software', 'Beheer'],
    omschrijving: 'Ontwikkelaars en beheerders die snel inzetbaar zijn bij pieken in werk of bij de start van een nieuw systeem.',
    contact: 'ictflexpool@example.nl',
  },
  {
    id: 'security-pool-overheid',
    naam: 'Securitypool Overheid',
    organisatie: 'Samenwerkingsverband Digitale Veiligheid',
    plaats: 'Den Haag', lat: 52.0799, lon: 4.3113,
    organisaties: ['Overheidsbreed'],
    vakgebieden: ['Security'],
    omschrijving: 'Securityspecialisten voor risicoanalyses, pentesten en het opvolgen van incidenten, voor alle overheidslagen.',
    contact: 'securitypool@example.nl',
  },
  {
    id: 'architectenpool',
    naam: 'Architectenpool Digitale Overheid',
    organisatie: 'Samenwerkingsverband Digitale Overheid',
    plaats: 'Den Haag', lat: 52.0799, lon: 4.3113,
    organisaties: ['Overheidsbreed', 'Rijksoverheid'],
    vakgebieden: ['Architectuur', 'Informatie'],
    omschrijving: 'Enterprise- en informatiearchitecten die meedenken over de inrichting van processen, gegevens en systemen.',
    contact: 'architectenpool@example.nl',
  },
  {
    id: 'haagse-gemeentepool',
    naam: 'Haagse Gemeentepool Digitalisering',
    organisatie: 'Gemeente Den Haag (voorbeeld)',
    plaats: 'Den Haag', lat: 52.0799, lon: 4.3113,
    organisaties: ['Gemeente'],
    vakgebieden: ['Projecten', 'Informatie'],
    omschrijving: 'Projectleiders en informatieadviseurs die gemeenten in de regio Haaglanden ondersteunen.',
    contact: 'gemeentepool@example.nl',
  },
  {
    id: 'ai-expertpool',
    naam: 'AI Expertpool',
    organisatie: 'Ministerie van Voorbeeldzaken',
    plaats: 'Den Haag', lat: 52.0799, lon: 4.3113,
    organisaties: ['Rijksoverheid', 'Overheidsbreed'],
    vakgebieden: ['AI', 'Data'],
    omschrijving: 'Specialisten in machine learning en verantwoorde inzet van algoritmen, met kennis van de AI-verordening.',
    contact: 'aipool@example.nl',
  },
  {
    id: 'noord-hollandse-pool',
    naam: 'Noord-Hollandse Digipool',
    organisatie: 'Provincie Noord-Holland (voorbeeld)',
    plaats: 'Haarlem', lat: 52.3874, lon: 4.6462,
    organisaties: ['Provincies', 'Gemeente'],
    vakgebieden: ['Data', 'Projecten', 'Informatie'],
    omschrijving: 'Een gedeelde pool van provincie en gemeenten in Noord-Holland voor tijdelijke inzet op digitaliseringsprojecten.',
    contact: 'digipool-nh@example.nl',
  },
  {
    id: 'waterschapspool',
    naam: 'Waterschapspool ICT',
    organisatie: 'Samenwerkende waterschappen (voorbeeld)',
    plaats: 'Utrecht', lat: 52.0907, lon: 5.1214,
    organisaties: ['Waterschappen'],
    vakgebieden: ['Beheer', 'Security', 'Software'],
    omschrijving: 'Beheerders en securityspecialisten met ervaring in procesautomatisering en operationele technologie.',
    contact: 'waterschapspool@example.nl',
  },
  {
    id: 'brabantse-talentpool',
    naam: 'Brabantse Talentpool Digitaal',
    organisatie: 'Provincie Noord-Brabant (voorbeeld)',
    plaats: 'Breda', lat: 51.5719, lon: 4.7683,
    organisaties: ['Provincies', 'Gemeente'],
    vakgebieden: ['Software', 'Data', 'Projecten'],
    omschrijving: 'Jonge professionals en ervaren specialisten die afwisselend bij Brabantse overheden werken.',
    contact: 'talentpool-brabant@example.nl',
  },
];
