// ---------------------------------------------------------------------------
// Tutorial step definitions & types
// ---------------------------------------------------------------------------

export type TutorialPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TutorialStep {
  id: string;
  /** data-tutorial attribute value on the target element, or null for modal-only steps */
  target: string | null;
  /** Per-layout tab/nav to switch to before showing this step */
  navigateTo: {
    webapp: string | null;
    dmi: string | null;
    rebel: string | null;
  };
  title: string;
  description: string;
  placement: TutorialPlacement;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    target: null,
    navigateTo: { webapp: null, dmi: null, rebel: null },
    title: 'Welkom bij de Tutorial',
    description:
      'Deze interactieve rondleiding laat u stap voor stap zien hoe u de Rekentool Ruimte voor Stadslogistiek gebruikt. U leert hoe u functies invoert, voertuigen clustert, service levels instelt en de simulatie uitvoert.',
    placement: 'center',
  },
  {
    id: 'navigation',
    target: 'nav-tabs',
    navigateTo: { webapp: 'dashboard', dmi: 'cockpit', rebel: 'cockpit' },
    title: 'Navigatie',
    description:
      'Gebruik de navigatieknoppen om tussen de verschillende onderdelen van de tool te schakelen. Elk tabblad heeft een specifieke functie: van invoer tot resultaten.',
    placement: 'bottom',
  },
  {
    id: 'function-inputs',
    target: 'function-inputs',
    navigateTo: { webapp: 'invoer', dmi: 'cockpit', rebel: 'cockpit' },
    title: 'Inventarisatie Functies',
    description:
      'Hier voert u het aantal eenheden per stedelijke functie in (bijv. woningen, supermarkten, kantoren). Deze aantallen bepalen het verwachte verkeer en de bijbehorende ruimtebehoefte.',
    placement: 'right',
  },
  {
    id: 'preset-data',
    target: 'preset-gerard',
    navigateTo: { webapp: 'invoer', dmi: 'cockpit', rebel: 'inputs' },
    title: 'Voorbeelddata Laden',
    description:
      'Klik op "Gerard Doustraat" om voorbeelddata te laden van een echte casus in Amsterdam. Dit helpt u snel te starten zonder handmatig alle waarden in te voeren. Of selecteer een leeg model om de waarden van uw eigen project in te voeren.',
    placement: 'bottom',
  },
  {
    id: 'clustering',
    target: 'cluster-matrix',
    navigateTo: { webapp: 'clustering', dmi: 'cockpit', rebel: 'cockpit' },
    title: 'Voertuig Clustering',
    description:
      'Wijs voertuigtypen toe aan clusters. Voertuigen in hetzelfde cluster delen dezelfde laad-/losruimte. Gebruik de radioknoppen om elk voertuigtype aan een cluster toe te wijzen.',
    placement: 'left',
  },
  {
    id: 'service-levels',
    target: 'service-levels',
    navigateTo: { webapp: 'clustering', dmi: 'cockpit', rebel: 'cockpit' },
    title: 'Service Level',
    description:
      'Stel per cluster het gewenste service level in (75%–95%). Een hoger service level betekent meer ruimte om pieken op te vangen, maar vereist ook meer laad-/losoppervlak.',
    placement: 'left',
  },
  {
    id: 'run-simulation',
    target: 'run-simulation',
    navigateTo: { webapp: 'clustering', dmi: 'cockpit', rebel: 'cockpit' },
    title: 'Simulatie Uitvoeren',
    description:
      'Klik op "Run Simulaties" om de Monte Carlo simulatie te starten. De slider bepaalt het aantal simulaties — meer simulaties geven nauwkeurigere resultaten maar duren langer.',
    placement: 'top',
  },
  {
    id: 'kpi-results',
    target: 'kpi-results',
    navigateTo: { webapp: 'resultaten', dmi: 'cockpit', rebel: 'cockpit' },
    title: 'Resultaten: KPI\'s',
    description:
      'Na de simulatie verschijnen hier de belangrijkste kengetallen: totaal aantal functies, verwachte voertuigen per dag, benodigde lengte en oppervlakte voor laden en lossen.',
    placement: 'bottom',
  },
  {
    id: 'result-charts',
    target: 'result-charts',
    navigateTo: { webapp: 'resultaten', dmi: 'cockpit', rebel: 'cockpit' },
    title: 'Resultaten: Grafieken',
    description:
      'De grafieken tonen gedetailleerde resultaten per cluster: ruimteverdeling, voertuigaankomsten en de service level curve. Klik op een cluster voor meer details.',
    placement: 'top',
  },
  {
    id: 'completion',
    target: null,
    navigateTo: { webapp: null, dmi: null, rebel: null },
    title: 'Tutorial Voltooid!',
    description:
      'U kent nu de basisstappen van de rekentool. Begin met het invoeren van uw eigen gegevens, of bekijk de uitgewerkte Gerard Doustraat casus in de handleiding voor een compleet voorbeeld met toelichting.',
    placement: 'center',
  },
];
