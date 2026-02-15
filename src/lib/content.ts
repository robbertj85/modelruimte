// ---------------------------------------------------------------------------
// Shared content for Cover page and Handleiding across all 3 layouts
// ---------------------------------------------------------------------------

export interface PartnerLogo {
  src: string;
  alt: string;
  organization: string;
}

export interface HandleidingSection {
  title: string;
  paragraphs: string[];
}

// ---------------------------------------------------------------------------
// Partner logos
// ---------------------------------------------------------------------------
export const PARTNER_LOGOS: PartnerLogo[] = [
  { src: '/logos/DMI-ECOSYSTEEM-LOGO-RGB-72dpi.png', alt: 'DMI Ecosysteem', organization: 'DMI Ecosysteem' },
  { src: '/logos/Amsterdam-logo.png', alt: 'Gemeente Amsterdam', organization: 'Gemeente Amsterdam' },
  { src: '/logos/utrecht-logo.jpg', alt: 'Gemeente Utrecht', organization: 'Gemeente Utrecht' },
  { src: '/logos/HvA-logo.png', alt: 'Hogeschool van Amsterdam', organization: 'Hogeschool van Amsterdam' },
  { src: '/logos/HAN-logo.png', alt: 'HAN University of Applied Sciences', organization: 'HAN University of Applied Sciences' },
  { src: '/logos/BUAS-logo.jpg', alt: 'Breda University of Applied Sciences', organization: 'Breda University of Applied Sciences' },
  { src: '/logos/Rebel_logo.png', alt: 'Rebel Group', organization: 'Rebel Group' },
  { src: '/logos/Posad_logo.png', alt: 'Posad Maxwan', organization: 'Posad Maxwan' },
];

// ---------------------------------------------------------------------------
// Cover page data
// ---------------------------------------------------------------------------
export const COVER = {
  title: 'Ruimtemodel Stadslogistiek',
  subtitle: 'Monte Carlo-simulatie voor het dimensioneren van laad- en losruimte',
  description:
    'Het Ruimtemodel Stadslogistiek is ontwikkeld om gemeenten, gebiedsontwikkelaars en logistieke planners te ondersteunen bij het bepalen van de benodigde ruimte voor stedelijke logistiek. Het model maakt gebruik van Monte Carlo-simulatie om stochastische voertuigaankomsten te modelleren en op basis daarvan de piekbelasting te berekenen.',
  projectLabel: 'Een samenwerking van:',
};

// ---------------------------------------------------------------------------
// Handleiding sections
// ---------------------------------------------------------------------------
export const HANDLEIDING_SECTIONS: HandleidingSection[] = [
  {
    title: '1. Algemeen',
    paragraphs: [
      'Het Ruimtemodel Stadslogistiek is een simulatietool dat de benodigde laad- en losruimte berekent voor stedelijke gebiedsontwikkelingen. Het model werkt op basis van Monte Carlo-simulatie: het genereert duizenden willekeurige scenario\'s van voertuigaankomsten en bepaalt daaruit de piekbelasting.',
      'Het model combineert drie kernconcepten: functies (het type en aantal voorzieningen in een gebied), voertuigtypen (de verschillende soorten voertuigen die goederen leveren) en verdelingen (de statistische patronen van aankomsten per tijdvak).',
      'De uitkomst is de benodigde lengte (in meters) laad- en losruimte die nodig is om een bepaald service level te garanderen \u2014 bijvoorbeeld dat 95% van de tijd voldoende ruimte beschikbaar is.',
    ],
  },
  {
    title: '2. Input voor het model',
    paragraphs: [
      'De invoer bestaat uit het aantal eenheden per functie in het plangebied. Functies zijn onder andere: Woningen, Supermarkt, Overige food, Non-food winkels, Horeca, Kantoren, Leisure/Sport, Onderwijs, en Gezondheidszorg. Elke functie wordt uitgedrukt in een specifieke eenheid (bijv. aantal woningen, m\u00B2 BVO).',
      'De BVO-conversietabel vertaalt bruto vloeroppervlakte (m\u00B2) naar het equivalent aantal eenheden dat het model gebruikt voor de berekening van voertuigbewegingen.',
      'Voertuigtypen worden ingedeeld in clusters die dezelfde fysieke laad-/losruimte delen. Per cluster wordt een service level ingesteld dat bepaalt welk percentage van de tijd de beschikbare ruimte toereikend moet zijn.',
    ],
  },
  {
    title: '3. Overzicht functies',
    paragraphs: [
      'Elke functie in het model vertegenwoordigt een categorie stedelijke voorzieningen. De functies zijn gekoppeld aan SBI-codes (Standaard Bedrijfsindeling) en genereren elk een kenmerkend patroon van voertuigbewegingen.',
      'Woningen genereren pakketbezorgingen en verhuizingen. Supermarkten hebben frequente leveringen van verse producten. Kantoren ontvangen post, pakketten en facilitaire leveringen. Horeca heeft dagelijkse leveringen van dranken en voedsel.',
      'Het model houdt rekening met het gemiddeld aantal stops per eenheid per week, de verdeling over voertuigtypen, en het tijdspatroon van aankomsten gedurende de dag.',
    ],
  },
  {
    title: '4. Resultaten',
    paragraphs: [
      'De resultaten tonen de benodigde laad- en losruimte per cluster en per voertuigtype. De belangrijkste KPI is de totale benodigde lengte in meters, berekend op het gekozen service level.',
      'Per cluster wordt weergegeven: het aantal verwachte voertuigen per dag, het maximaal gelijktijdig aanwezige aantal voertuigen (bij het gekozen service level), en de daaruit volgende benodigde ruimte.',
      'De service level-curve toont het verband tussen het gekozen service level en de benodigde ruimte. Een hoger service level resulteert in meer benodigde ruimte, maar biedt meer zekerheid dat er voldoende plek is tijdens piekuren.',
      'Het piekprofiel per tijdvak laat zien in welk deel van de dag de meeste laad-/losruimte nodig is, zodat beleidsmakers gericht maatregelen kunnen nemen.',
    ],
  },
  {
    title: '5. Werking Ruimtemodel',
    paragraphs: [
      'Het model doorloopt vijf stappen om de benodigde ruimte te berekenen:',
      'Stap 1 \u2014 Berekenen stops per functie: Op basis van het aantal eenheden per functie en de gemiddelde stops per eenheid per week wordt het totale aantal voertuigstops berekend.',
      'Stap 2 \u2014 Kansverdeling per voertuigtype: De voertuigstops worden verdeeld over de verschillende voertuigtypen (pakketdiensten, vrachtwagens, bestelbussen, etc.) op basis van empirische kansverdelingen.',
      'Stap 3 \u2014 Simulatie van aankomsten: Met Monte Carlo-simulatie worden duizenden scenario\'s gegenereerd waarin voertuigen op willekeurige momenten aankomen, rekening houdend met het tijdsprofiel per dagdeel.',
      'Stap 4 \u2014 Bepaling clusters en service levels: Per cluster wordt bepaald hoeveel voertuigen maximaal gelijktijdig aanwezig zijn bij het gekozen service level. Dit bepaalt het aantal benodigde laad-/losplekken.',
      'Stap 5 \u2014 Resultaten: De benodigde lengte per voertuigtype wordt opgeteld per cluster en over alle clusters heen tot het totale ruimtebeslag. De resultaten worden gepresenteerd in grafieken en tabellen.',
    ],
  },
];
