// ---------------------------------------------------------------------------
// Shared content for Cover page and Handleiding across all 3 layouts
// ---------------------------------------------------------------------------

import { createElement, Fragment, type ReactNode } from 'react';

/**
 * Parse **bold** markdown in a plain string and return React elements.
 * Usage: renderBold('Hello **world**') → <>Hello <strong>world</strong></>
 */
export function renderBold(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) =>
      i % 2 === 1 ? createElement('strong', { key: i }, part) : part,
    ),
  );
}

export interface PartnerLogo {
  src: string;
  alt: string;
  organization: string;
}

export interface PartnerSection {
  label: string;
  logos: PartnerLogo[];
}

export type DiagramKey =
  | 'model-overview'
  | 'input-structure'
  | 'functions-overview'
  | 'cluster-service-level'
  | 'cluster-allocation-animation'
  | 'time-periods'
  | 'simulation-process';

export interface HandleidingTable {
  headers: string[];
  rows: string[][];
  /** Optional caption displayed below the table */
  caption?: string;
}

export interface HandleidingSection {
  title: string;
  paragraphs: string[];
  /** Optional table(s) to render after paragraphs, before diagrams */
  tables?: HandleidingTable[];
  /** Optional diagram(s) to render after tables */
  diagrams?: DiagramKey[];
}

// ---------------------------------------------------------------------------
// Partner logos — ordered per the official cover page
// ---------------------------------------------------------------------------

export const PARTNER_SECTIONS: PartnerSection[] = [
  {
    label: 'Gerealiseerd door',
    logos: [
      { src: '/logos/Rebel_logo.png', alt: 'Rebel Group', organization: 'Rebel Group' },
    ],
  },
  {
    label: 'In samenwerking met',
    logos: [
      { src: '/logos/HAN-logo.png', alt: 'HAN University of Applied Sciences', organization: 'HAN University of Applied Sciences' },
      { src: '/logos/BUAS-logo.jpg', alt: 'Breda University of Applied Sciences', organization: 'Breda University of Applied Sciences' },
      { src: '/logos/Posad_logo.png', alt: 'Posad Maxwan', organization: 'Posad Maxwan' },
    ],
  },
  {
    label: 'Met dank aan volgende partijen voor het aanleveren van data en feedback',
    logos: [
      { src: '/logos/Amsterdam-logo.png', alt: 'Gemeente Amsterdam', organization: 'Gemeente Amsterdam' },
      { src: '/logos/utrecht-logo.jpg', alt: 'Gemeente Utrecht', organization: 'Gemeente Utrecht' },
      { src: '/logos/HvA-logo.png', alt: 'Hogeschool van Amsterdam', organization: 'Hogeschool van Amsterdam' },
    ],
  },
  {
    label: 'Dit project wordt mede-gerealiseerd vanuit Plan van Aanpak Slimme Duurzame Verstedelijking en Logistiek (DMI)',
    logos: [
      { src: '/logos/DMI-ECOSYSTEEM-LOGO-RGB-72dpi.png', alt: 'DMI Ecosysteem', organization: 'DMI Ecosysteem' },
    ],
  },
];

/** Flat list for backward compatibility */
export const PARTNER_LOGOS: PartnerLogo[] = PARTNER_SECTIONS.flatMap((s) => s.logos);

// ---------------------------------------------------------------------------
// Contact info
// ---------------------------------------------------------------------------
export const CONTACT = {
  label: 'Contact',
  lines: [
    'Rebel: Laura.Tavernier@rebelgroup.com',
    'DMI (Robbert Janssen): dmiteam@minienw.nl',
  ],
};

// ---------------------------------------------------------------------------
// Cover page data
// ---------------------------------------------------------------------------
export const COVER = {
  title: 'Rekentool Ruimte voor Stadslogistiek',
  subtitle: '',
  description:
    'Stadslogistiek — alle leveringen, ophalingen en diensten in de stad — zorgt voor een steeds toenemende druk op de beperkte stedelijke ruimte.',
  paragraphs: [
    'Om stedenbouwkundigen, beleidsadviseurs en vastgoedontwikkelaars een beter inzicht te geven in het ruimtebeslag van deze logistieke activiteiten, is de Rekentool Ruimte voor Stadslogistiek ontwikkeld. Dit is een eerste prototype van een model dat de ruimtevraag van stadslogistieke voertuigen in beeld brengt, met onderscheid in type voertuigen en tijdsvensters.',
  ],
  license: {
    label: 'LICENTIE',
    text: 'Deze tool is open source beschikbaar onder de EUPL-1.2 licentie. Gemeenten, universiteiten, hogescholen en andere partijen kunnen het model vrij gebruiken, testen en verder aanvullen.',
  },
  projectLabel: 'Een samenwerking van:',
};

// ---------------------------------------------------------------------------
// Handleiding sections
// ---------------------------------------------------------------------------
export const HANDLEIDING_SECTIONS: HandleidingSection[] = [
  {
    title: '1. Algemeen',
    paragraphs: [
      'De Rekentool Ruimte voor Stadslogistiek is een simulatietool dat de benodigde laad- en losruimte berekent voor stedelijke gebiedsontwikkelingen. Het model werkt op basis van Monte Carlo-simulatie: het genereert duizenden willekeurige scenario\'s van voertuigaankomsten en bepaalt daaruit de piekbelasting. De **cockpit** fungeert als het centrale punt van het model: hier vult u de inputs in, voert u simulaties uit en bekijkt u de resultaten.',
      'Bij het invullen of wijzigen van inputs is altijd een **nieuwe simulatie** nodig om de ruimtebehoefte te berekenen \u2014 dit gebeurt niet automatisch. Gebruik de knop **"Run Simulaties"**. Vanaf ongeveer 100 tot 200 simulaties levert het model betrouwbare resultaten; meer simulaties (max. 1000) geeft nauwkeurigere berekeningen maar duurt langer.',
      'De **beleveringsprofielen** voor de functies zijn terug te vinden via het tabblad "Inputs". Deze profielen bevatten informatie over het gemiddeld aantal stops per week en de gemiddelde stoptijd per functie. Ze zijn generiek ingevuld op basis van eerder onderzoek (o.a. Outlooks Stadslogistiek van TNO) en kunnen als standaard worden gebruikt, maar ook aangepast worden aan de specifieke situatie.',
      'De uitkomst is de **benodigde lengte (in meters)** laad- en losruimte die nodig is om een bepaald service level te garanderen. Het is belangrijk om te beseffen dat de resultaten inschattingen zijn van het aantal stops en ruimtegebruik en een eerste aanzet om meer grip te krijgen op de ruimtevraag van logistieke voertuigen. De resultaten kunnen afwijken van de werkelijke situatie (die ook dagelijks zal fluctueren).',
    ],
    diagrams: ['model-overview'],
  },
  {
    title: '2. Input voor het model',
    paragraphs: [
      'De invoer gebeurt op **drie plekken** in het model:',
      '**1. Inventarisatie van functies:** Geef het aantal eenheden in (of een inschatting ervan) per functie. Functies zijn onder andere: Woningen, Supermarkt, Retail Food, Winkels (keten en onafhankelijk), Horeca, Hotels, en Kantoren (klein, middel, groot). Elke functie wordt uitgedrukt in een specifieke eenheid (bijv. aantal woningen, aantal vestigingen).',
      '**2. Bepalen van clusters:** Voertuigtypen worden ingedeeld in clusters die dezelfde fysieke laad- en losruimte delen. Het meest eenvoudige is om alle voertuigen aan \u00e9\u00e9n cluster toe te bedelen. Door bepaalde voertuigen in een aparte cluster te plaatsen (bv. cargofietsen of service bestelwagens) krijg je een gedetailleerder beeld en kun je bijvoorbeeld besluiten om voor deze voertuigen speciaal ingerichte zones of extra parkeerplekken te voorzien.',
      '**3. Bepalen van service level per cluster:** Keuze binnen het bereik 75%\u201395%. Een hoger serviceniveau betekent een hogere kans dat een laad- en losplek vrij is op het moment dat het logistiek voertuig aankomt, maar ook meer ruimte die gereserveerd moet worden. Een lager niveau bespaart ruimte, maar vergroot het risico op zoekverkeer, dubbel parkeren en onveilige situaties.',
      'Bij een **herinrichtingsproject** kunt u de functies ophalen door: (1) vast te stellen welke adressen binnen de scope vallen, (2) de BAG-gegevens te filteren op die adressen, (3) per adres de functie toe te kennen overeenkomstig de functies uit het model, en (4) het aantal eenheden per functie op te tellen.',
      'Bij een **ontwikkelingsproject** waarbij alleen m\u00B2 BVO bekend is, kunt u onderstaande omrekentabel gebruiken. Dit is een ruwe omzetting van m\u00B2 naar aantal eenheden. Pas de input altijd aan op basis van de specifieke eigenschappen van het project.',
    ],
    tables: [
      {
        headers: ['Categorie', 'Functie', 'Gem. BVO', 'Standaard aandeel'],
        rows: [
          ['Woningen', 'Woningen', '90 m\u00B2', '\u2014'],
          ['Detailhandel', 'Supermarkt', '1.500 m\u00B2', '15%'],
          ['Detailhandel', 'Retail Food', '350 m\u00B2', '25%'],
          ['Detailhandel', 'Winkels (keten)', '750 m\u00B2', '30%'],
          ['Detailhandel', 'Winkels (onafh.)', '350 m\u00B2', '30%'],
          ['Horeca', 'Restaurant (high-end)', '500 m\u00B2', '10%'],
          ['Horeca', 'Restaurant (basis)', '250 m\u00B2', '25%'],
          ['Horeca', 'Caf\u00e9', '250 m\u00B2', '15%'],
          ['Horeca', 'Hotel', '3.000 m\u00B2', '50%'],
          ['Kantoren', 'Kantoor klein', '1.250 m\u00B2', '50%'],
          ['Kantoren', 'Kantoor middel', '5.000 m\u00B2', '50%'],
          ['Kantoren', 'Kantoor groot', '10.000 m\u00B2', '\u2014'],
        ],
        caption: 'Opgelet: deze omrekentabel is een ruwe en gemiddelde inschatting. Het effectieve aantal eenheden is afhankelijk van type ontwikkeling en type gebied. Controleer altijd of de inschatting klopt op basis van de beschikbare informatie.',
      },
    ],
    diagrams: ['input-structure'],
  },
  {
    title: '3. Overzicht functies',
    paragraphs: [
      'Elke functie in het model vertegenwoordigt een categorie stedelijke voorzieningen, gekoppeld aan SBI-codes (Standaard Bedrijfsindeling). Hieronder een overzicht:',
    ],
    tables: [
      {
        headers: ['#', 'Functie', 'Omschrijving', 'SBI-code'],
        rows: [
          ['1', 'Woningen', 'Aantal adressen. Een appartementsblok met 5 appartementen telt als 5 wooneenheden. Geen onderscheid naar type woning of oppervlakte.', '\u2014'],
          ['2', 'Supermarkt', 'Standaard supermarkt zonder L&L-ruimte op eigen terrein (bv. Lidl, Dirk).', '47.11'],
          ['3', 'Retail Food', 'Winkel waar bijna uitsluitend voedingsmiddelen worden verkocht (bv. bakkerijen, viswinkels, kaaswinkels, natuurvoeding).', '47.2'],
          ['4', 'Winkels (keten)', 'Retail voor mode, huishoudelijke artikelen, electronica en warenhuizen/groothandels (bv. Hema, H&M, Zara).', '46, 47.19, 47.4\u201347.7'],
          ['5', 'Winkels (onafh.)', 'Onafhankelijke boekenwinkel, elektronicazaak, fietsenmaker, etc.', '47.4\u201347.7'],
          ['6', 'Restaurant (high-end)', 'Gastronomisch restaurant (high en middle class).', '56.10.1'],
          ['7', 'Restaurant (basis)', 'Cafetaria, snackbar, eetkraam, fastfoodrestaurants.', '56.10.2'],
          ['8', 'Caf\u00e9', 'Caf\u00e9.', '56.3'],
          ['9', 'Hotel', 'Hotel met of zonder restaurant.', '55.101, 55.102'],
          ['10', 'Kantoor klein', 'Kantoren tot 2.500 m\u00B2 BVO.', '\u2014'],
          ['11', 'Kantoor middel', 'Kantoren tussen 2.500 m\u00B2 en 10.000 m\u00B2 BVO.', '\u2014'],
          ['12', 'Kantoor groot', 'Kantoren vanaf 10.000 m\u00B2, met meerdere huurders.', '\u2014'],
        ],
        caption: 'Dit prototype focust op een beperkt aantal stedelijke functies. Socio-maatschappelijke voorzieningen ontbreken nog en kunnen toebedeeld worden aan kantoor klein, middel of groot. Detailniveau (bv. AH to go vs. AH XL) ontbreekt; hiervoor wordt gewerkt met gemiddelden in de beleveringsprofielen.',
      },
    ],
    diagrams: ['functions-overview'],
  },
  {
    title: '4. Resultaten',
    paragraphs: [
      'Alle resultaten zijn na het uitvoeren van de **simulatie** zichtbaar in de **cockpit**. De **bovenste balk** geeft een overzicht van de belangrijkste parameters: het totaal aantal functies, het verwacht aantal voertuigen per dag, het gemiddelde service level en de totale ruimtevraag uitgedrukt in meters en vierkante meters.',
      'Vervolgens geven **grafieken** meer details via twee assen: de verwachte verdeling van voertuigen en de benodigde lengte per voertuig, per tijdsperiode.',
      'De **benodigde ruimte per cluster** geeft inzicht in de verschillende ruimtevraag per categorie. Clusters zijn door de gebruiker zelf in te stellen: u kiest welke voertuigtypen samen een cluster vormen. De onderstaande indeling is de standaard configuratie:',
    ],
    tables: [
      {
        headers: ['Cluster (standaard)', 'Voertuigtypen', 'Toelichting'],
        rows: [
          ['Cluster 1', 'Fiets, cargobike, scooter, LEVV\'s', 'Kleine voertuigen die typisch geen L&L-plek gebruiken.'],
          ['Cluster 2', 'Bestelwagens, vrachtwagens (N2, N3)', 'Maken meestal gebruik van een L&L-plek.'],
          ['Cluster 3', 'Service bestelwagens', 'Staan vaak langer stil en moeten een parkeerplek zoeken. De rekentool berekent het nodige aantal parkeerplekken apart.'],
        ],
      },
      {
        headers: ['Voertuigtype', 'Lengte'],
        rows: [
          ['Fiets, cargobike, scooter', '2 m'],
          ['LEVV / personenwagen', '6 m'],
          ['Bestelwagen <3,5 ton (N1)', '8 m'],
          ['Vrachtwagen (N2)', '11 m'],
          ['Grote vrachtwagen (N3)', '16 m'],
          ['Service bestelwagen', '8 m'],
        ],
      },
    ],
    diagrams: ['cluster-allocation-animation', 'cluster-service-level', 'time-periods'],
  },
  {
    title: '5. Werking Rekentool',
    paragraphs: [
      'Het model doorloopt **vijf opeenvolgende stappen** om tot een inschatting van de benodigde laad- en losruimte in een gebied te komen. De belangrijkste input is het aantal en type functies in een gebied. Deze worden gecombineerd met het aantal stops van verschillende type voertuigen (cargofietsen, bestelwagens, vrachtwagens, ...) binnen het gebied, de duur van een stop van de simulatie en onderverdeeld in dagdelen, uitgedrukt in intervallen van 10 minuten.',
      '**Stap 1 \u2014 Berekenen aantal stops per functie:** De gebruiker geeft per stedelijke functie (bv. woningen, supermarkt, hotel, ...) het **aantal eenheden** in. Deze inputs bevinden zich in de **cockpit** van het model. Op basis van elk van deze functies, berekent het model het aantal stops per voertuigtype op basis van empirische data (o.a. Outlooks Stadslogistiek van TNO). Het resultaat van stap 1 is per functietype een aantal stops opgesplitst naar type logistiek (bv. 8:00-12:00 of 12:00-18:00).',
      '**Stap 2 \u2014 Kansverdeling per voertuigtype:** In een volgende stap berekent het model de **kans op een stop per voertuigtype per periode per 10 minuten interval**. Dit geeft de kansverdeling voor voertuigen en verdeling op tijdsbasis weer, uitgedrukt als kans per interval. Deze kansverdeling wordt vervolgens gebruikt om in stap 3 de simulatie uit te voeren.',
      '**Stap 3 \u2014 Simulatie van boeking en bezetting:** Met Monte Carlo-simulatie worden een groot aantal scenario\'s gegenereerd. In elk scenario worden per interval willekeurig voertuigen gegenereerd op basis van de kansverdelingen. Elk voertuig heeft een vaste stopduur en bezet gedurende die tijd een laad-/losplek. Per simulatie wordt de **piekbelasting** bepaald \u2014 het maximaal gelijktijdig aanwezige aantal voertuigen.',
      '**Stap 4 \u2014 Bepalen van piek-overeenkomsten op basis van het service level:** Op basis van alle simulaties wordt per cluster en per voertuigtype een percentielanalyse uitgevoerd. Bij een service level van 95% wordt het 95e percentiel van de pieken genomen als benodigde capaciteit. De benodigde lengte per voertuigtype wordt berekend door het aantal piekvoertuigen te vermenigvuldigen met de voertuiglengte.',
      '**Stap 5 \u2014 Resultaten:** De benodigde lengte per voertuigtype wordt opgeteld per cluster en over alle clusters heen tot het totale ruimtebeslag. De resultaten worden gepresenteerd in grafieken en tabellen in de cockpit.',
    ],
    diagrams: ['simulation-process'],
  },
];

// ---------------------------------------------------------------------------
// Casus Gerard Doustraat
// ---------------------------------------------------------------------------

export interface CasusImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface CasusSection {
  title: string;
  paragraphs: string[];
  tables?: HandleidingTable[];
  images?: CasusImage[];
}

export const CASUS_GERARD_DOUSTRAAT: {
  title: string;
  subtitle: string;
  intro: string;
  sections: CasusSection[];
} = {
  title: 'Casus Gerard Doustraat',
  subtitle: 'Toepassing Rekentool Ruimte voor Stadslogistiek',
  intro:
    'Om te laten zien hoe de rekentool werkt en op welke manieren deze kan worden toegepast, is een casus uitgewerkt. In dit hoofdstuk wordt getoond hoe de rekentool is ingezet, welke output dit oplevert en hoe deze resultaten kunnen worden gebruikt in een stedenbouwkundige context en als basis voor het gesprek.',
  sections: [
    {
      title: 'Het projectgebied',
      paragraphs: [
        'Voor de casus is de Gerard Doubuurt in Amsterdam gekozen, met focus op de Gerard Doustraat. Deze straat staat op de planning voor groot onderhoud en herinrichting, waarvoor al plannen zijn opgesteld voor het traject tussen de Ferdinand Bolstraat en het Gerard Douplein.',
        'Binnen de scope van de casus vallen: de Gerard Doustraat, het Gerard Douplein, en het noordelijk deel van de Eerste van der Helststraat, aangezien een aantal functies die hier gelegen zijn worden bevoorraad vanuit het Gerard Douplein.',
        'De Gerard Doubuurt is een kleine, hoogstedelijke 19e-eeuwse buurt in De Pijp (Oude Pijp), stadsdeel Zuid. Het gebied wordt gekenmerkt door gesloten bouwblokken, compacte straatprofielen en een sterke functiemenging, met wonen boven winkels, horeca en voorzieningen in de plint.',
        'De openbare ruimte is schaars, waardoor keuzes nodig zijn tussen verschillende ruimteclaims, zoals groen, spelen en parkeren (fiets en auto).',
      ],
      images: [
        { src: '/casus/projectgebied.png', alt: 'Gerard Doubuurt, Amsterdam - Projectgebied', caption: 'Gerard Doubuurt: groot onderhoud. Bron: Gemeente Amsterdam.' },
      ],
    },
    {
      title: 'Logistiek en functies in bestaande situatie',
      paragraphs: [
        'De Gerard Doustraat heeft een smal profiel van circa 12 meter breed, met eenrichtingsverkeer, bomen aan beide zijden, parkeerplaatsen, veel fietsparkeerplekken en meerdere laad- en losplekken. De voetpaden zijn relatief smal en deels belemmerd door fietsparkeren, terrassen, winkelmeubilair en reclame-elementen.',
        'Het Gerard Douplein kent veel horecafuncties; een deel van het plein is ingericht voor fietsparkeren. Het gebied is levendig en intensief gebruikt, met veel voetgangers, fietsers, geparkeerde fietsen, scooters en logistiek verkeer.',
        'In de huidige situatie zijn er in totaal 17 laad- en losplekken: 11 plekken voor personenauto\u2019s en 6 plekken voor bestelwagens (langere parkeervakken). De totale lengte van deze laad- en losplekken bedraagt 91 meter.',
      ],
      images: [
        { src: '/casus/analyse-bestaande-situatie.png', alt: 'Analyse bestaande situatie met functies en laad- en losplekken', caption: 'Kaart analyse bestaande situatie met functies en laad- en losplekken. Bron: Rebel / D5 rapport.' },
        { src: '/casus/laad-losplekken-kaart.png', alt: 'Bestaande laad- en losplekken Gerard Doustraat', caption: 'Bestaande laad- en losplekken in het projectgebied. Bron: bereikbaarheid.amsterdam.nl.' },
      ],
    },
    {
      title: 'Invoer in het model',
      paragraphs: [
        'Binnen het studiegebied bevinden zich 415 functionele units, waarvan 52 niet-wonen. Deze functieverdeling is gebruikt als input voor de rekentool:',
        'Voor de clustering is in deze casus gekozen voor drie clusters (de standaard indeling): cluster 1 (fiets/cargobike en LEVV/personenwagens), cluster 2 (bestel- en vrachtwagens) en cluster 3 (service bestelwagens). Deze indeling is aanpasbaar — de gebruiker kan zelf bepalen welke voertuigtypen per cluster worden gegroepeerd. Het service level is voor alle clusters op 95% gezet, vanwege de smalle straten en weinig uitwijkmogelijkheden.',
      ],
      tables: [
        {
          headers: ['Functie', 'Aantal'],
          rows: [
            ['Woningen', '362'],
            ['Supermarkt', '0'],
            ['Retail Food', '9'],
            ['Winkels (keten)', '2'],
            ['Winkels (onafh.)', '27'],
            ['Restaurant (high-end)', '0'],
            ['Restaurant (basis)', '8'],
            ['Caf\u00e9', '7'],
            ['Hotel', '0'],
            ['Kantoor (klein)', '0'],
            ['Kantoor (middel)', '0'],
            ['Kantoor (groot)', '0'],
          ],
        },
      ],
      images: [
        { src: '/casus/functies-inventarisatie.png', alt: 'Inventarisatie functies in het projectgebied', caption: 'Inventarisatie van 415 functies in het projectgebied. Bron: D4 Casus Gerard Doustraat.' },
      ],
    },
    {
      title: 'Resultaten berekening',
      paragraphs: [
        'Op basis van de input berekent de tool een ruimtevraag van ongeveer 77 meter:',
        '\u2022 Cluster 1 (personenwagens): 12 strekkende meter \u2014 Ruimtelijke vertaling: 2 parkeerplaatsen van circa 5,5\u20136 meter per plek.',
        '\u2022 Cluster 2 (bestel- en vrachtwagens): 57 strekkende meter \u2014 Dit cluster vormt de grootste ruimtevraag. In totaal zijn 9 laad- en losplekken nodig, verdeeld over circa 3 laad- en loszones (3 of 4 bestelwagen-plekken naast elkaar).',
        '\u2022 Cluster 3 (service bestelwagens): 8 strekkende meter \u2014 Ruimtelijke vertaling: 2 parkeerplekken voor bestelwagens (circa 12 meter). Serviceverkeer staat vaak langer dan 1 uur stil. Een mogelijke oplossing is reguliere parkeerplaatsen te reserveren met specifieke markering.',
        'Deze berekende afstand is een ondergrens omdat dit prototype nog geen rekening houdt met alle type voorzieningen (bv. afval, bouw). Daarnaast is er ook altijd een ruimtelijke vertaling nodig van dit cijfer.',
      ],
      images: [
        { src: '/casus/resultaten-clusters.png', alt: 'Benodigde ruimte per cluster', caption: 'Resultaten berekening: benodigde ruimte per cluster. Totaal: 77 strekkende meter.' },
        { src: '/casus/ruimtelijke-vertaling.png', alt: 'Rekentool en output stap 2', caption: 'Stap 2: Rekentool output met verwachte voertuigen, clustering en benodigde ruimte. Bron: D5 rapport.' },
      ],
    },
    {
      title: 'Vergelijking met de huidige situatie',
      paragraphs: [
        'De uitkomst van de rekentool\u201413 laad- en losplekken\u2014ligt circa vier plekken lager dan de bestaande situatie (17 plekken, 91 meter). Vanuit stedenbouwkundig perspectief is dit een positieve uitkomst: minder ruimte voor laden en lossen betekent potentieel meer ruimte voor andere ruimtelijke claims die de kwaliteit van de openbare ruimte kunnen verhogen, zoals vergroening, terrassen of fietsparkeren.',
        'De herinrichtingsplannen voorzien in totaal 13 parkeerplekken voor laden en lossen, waarvan 5 plekken geschikt zijn voor bestelwagens en 3 gecombineerde zones \u2018laden en lossen \u2013 fietsvak\u2019, samen goed voor 8 parkeerplekken. Dit komt goed overeen met de uitkomsten van de rekentool.',
      ],
      images: [
        { src: '/casus/ruimtelijke-scenarios.png', alt: 'Totaalbeeld vergelijking bestaande situatie met rekentool', caption: 'Vergelijking bestaande situatie (91m) met rekentool output (77m) en herinrichtingsplan (13 plekken). Bron: D5 rapport.' },
      ],
    },
    {
      title: 'Ruimtelijke scenario\u2019s',
      paragraphs: [
        'De resultaten van de rekentool vormen een basis voor een dialoog over de ruimtelijke reservering voor logistiek in relatie tot andere ambities in het gebied. Op basis van de output kunnen verschillende scenario\u2019s worden verkend:',
        'A. Verspreiding in de straat \u2014 Alle laad- en loszones blijven, net als in de huidige situatie, verspreid over de straat.',
        'B. Clusteren nabij functies \u2014 Meer clustering van laad- en loszones nabij functies met een hoge logistieke vraag, zoals een langere zone bij winkelstroken en \u00e9\u00e9n zone bij het horecacluster, maar niet direct bij terrassen.',
        'C. Meer dubbelgebruik van ruimte \u2014 Door inzicht in tijdsvensters van verschillende logistieke stromen biedt de rekentool aanknopingspunten voor dubbelgebruik van ruimte (bv. combinatie laad- en loszones met fietsvakken, of tijdelijk gebruik van een plein voor laden en lossen in de ochtend).',
        'D. Opschalen: oplossing op de schaal van de buurt / wijk \u2014 Verkenning van een ander logistiek systeem, bijvoorbeeld met logistieke hubs in de buurt voor bevoorrading van winkels, horeca en bewoners.',
      ],
      images: [
        { src: '/casus/tijdsperiode-stromen.png', alt: 'Tijdsperiode van diverse logistieke stromen', caption: 'Diagram tijdsperiode van diverse stromen, schets op basis van casus Gerard Doustraat. Bron: D5 rapport.' },
      ],
    },
    {
      title: 'Kwalitatieve reflectie',
      paragraphs: [
        'Het model is per definitie een vereenvoudigde weergave van de werkelijkheid. De meerwaarde is dat er hiermee op een redelijk laagdrempelig niveau een schatting gemaakt kan worden van de benodigde ruimte voor de stadslogistiek.',
        'Enkele aandachtspunten:',
        '\u2022 De aannames die ten grondslag liggen aan het model zouden op sommige punten beter kunnen, als er betere data beschikbaar zijn. Bepaalde (logistieke) bewegingen ontbreken nu, zoals verhuizingen, bouw en maaltijdbezorgingen.',
        '\u2022 Het model maakt nu geen onderscheid naar wijktype (historische binnenstad, oude stadswijk, hoogbouw, autoluwe wijk, suburbia). Dit kan deels door serviceniveau aan te geven waar vanuit de straat- of wijktype behoefte aan is.',
        '\u2022 Het model voorziet nu niet in het selecteren van opties die invloed kunnen hebben op de stadslogistieke ruimtevraag, zoals pakketautomaten, inpandig laden en lossen, of het gebruik van microhubs.',
        '\u2022 Tijdsvensters zorgen bijvoorbeeld voor meer voertuigen tegelijkertijd en daarbij neemt de ruimtevraag toe. Daarnaast hebben afspraken in ketens (ontvanger-gedreven) invloed op de ruimtevraag, bijvoorbeeld tijdsloten voor horeca-leveringen.',
      ],
    },
    {
      title: 'Toekomstplannen Gerard Doubuurt',
      paragraphs: [
        'De gemeente Amsterdam onderzoekt de mogelijkheid van het inzetten van microhubs of mobiele overslagpunten voor de bevoorrading van bedrijven en bewoners. Dit maakt deel uit van een breder onderzoek dat zich richt op het verbeteren van de stadslogistiek, het verminderen van de verkeersdrukte en het bevorderen van uitstootvrij vervoer.',
        'De inrichtingsprincipes voor het projectgebied voorzien onder andere in 22 laad- en losvakken van 2,10 m breed x 7,00 m lang, 2.000 fietsparkeervoorzieningen, en 150 scomba-plaatsen (scooter, motor, bakfiets).',
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Key concepts — used in tooltips / info boxes
// ---------------------------------------------------------------------------
export const KEY_CONCEPTS = {
  serviceLevel:
    'Bij het bepalen van de benodigde laad- en losruimte kan je het service level defini\u00EBren. Dit geeft de kans weer dat een voertuig bij aankomst direct kan laden en lossen. Een service level van 80% betekent dat in 80% van de gevallen een plek beschikbaar is, terwijl in 20% van de gevallen moet worden uitgeweken naar een andere locatie.',
  clusters:
    'Voor een correcte berekening van het service level wordt gewerkt met clusters van voertuigen die dezelfde laad- en losplekken kunnen gebruiken. Binnen \u00e9\u00e9n cluster delen de voertuigen dezelfde capaciteit. Zo kunnen personenauto\'s en bestelwagens samen \u00e9\u00e9n cluster vormen (omdat zij dezelfde plekken gebruiken), terwijl fietsen een aparte cluster kunnen vormen omdat zij andere zones benutten.',
};
