import { getLocale, type Locale } from './i18n'

/** UI-chrome copy only (header, form, results scaffolding, hints). Tax
 * breakdown component labels and warnings are generated per-canton inside
 * src/tax/ and are not covered here — see the canton modules under
 * src/tax/ch/*. */
const translations = {
  appTitle: {
    de: 'Schweizer Steuerkarte',
    fr: 'Carte fiscale suisse',
    it: 'Mappa fiscale svizzera',
    en: 'Swiss Tax Map',
  },
  appSubtitle: {
    de: 'Klicken Sie auf eine Gemeinde, um Einkommens- und Vermögenssteuer zu schätzen — Bund, Kanton, Gemeinde und Kirche.',
    fr: "Cliquez sur une commune pour estimer l'impôt sur le revenu et la fortune — fédéral, cantonal, communal et ecclésiastique.",
    it: 'Clicca su un comune per stimare le imposte sul reddito e sulla sostanza — federale, cantonale, comunale ed ecclesiastica.',
    en: 'Click a municipality to estimate income & wealth tax — federal, cantonal, communal and church.',
  },
  languageLabel: {
    de: 'Sprache',
    fr: 'Langue',
    it: 'Lingua',
    en: 'Language',
  },
  aboutSummary: {
    de: 'Über diese Daten',
    fr: 'À propos de ces données',
    it: 'Informazioni su questi dati',
    en: 'About this data',
  },
  aboutBody: {
    de: 'Die Bundessteuerwerte folgen dem offiziellen ESTV-Tarif und den Abzügen für 2026. Die kantonale, kommunale und kirchliche Steuer ist für <strong>alle 26 Kantone</strong> präzise modelliert — Zürich, Bern, Luzern, Uri, Schwyz, Obwalden, Nidwalden, Glarus, Zug, Freiburg, Solothurn, Basel-Stadt, Basel-Landschaft, Schaffhausen, Appenzell Ausserrhoden, Appenzell Innerrhoden, St. Gallen, Graubünden, Aargau, Thurgau, Tessin, Waadt, Wallis, Neuenburg, Genf und Jura — anhand des jeweils geltenden kantonalen Steuerrechts und der Gemeinde-Steuerfüsse. Abzugsbeträge folgen überall dem Bundesschema (die eigenen Abzugsregeln der Kantone weichen ab, sind hier aber nicht modelliert); die tatsächlich angewendeten Abzüge werden immer angezeigt. Die Gemeindegrenzen stammen von © swisstopo / BFS GEOSTAT (swiss-maps), nicht-kommerzielle Nutzung mit Quellenangabe.',
    fr: "Les valeurs de l'impôt fédéral suivent le barème et les déductions officiels de l'AFC pour 2026. L'impôt cantonal, communal et ecclésiastique est modélisé avec précision pour <strong>les 26 cantons</strong> — Zurich, Berne, Lucerne, Uri, Schwyz, Obwald, Nidwald, Glaris, Zoug, Fribourg, Soleure, Bâle-Ville, Bâle-Campagne, Schaffhouse, Appenzell Rhodes-Extérieures, Appenzell Rhodes-Intérieures, Saint-Gall, Grisons, Argovie, Thurgovie, Tessin, Vaud, Valais, Neuchâtel, Genève et Jura — sur la base du droit fiscal cantonal et des coefficients communaux en vigueur. Les déductions suivent partout le barème fédéral (les règles propres à chaque canton diffèrent mais ne sont pas modélisées ici) ; les déductions réellement appliquées sont toujours affichées. Les limites communales proviennent de © swisstopo / BFS GEOSTAT (swiss-maps), usage non commercial avec mention de la source.",
    it: "I valori dell'imposta federale seguono la tariffa e le deduzioni ufficiali dell'AFC per il 2026. L'imposta cantonale, comunale ed ecclesiastica è modellata con precisione per <strong>tutti i 26 cantoni</strong> — Zurigo, Berna, Lucerna, Uri, Svitto, Obvaldo, Nidvaldo, Glarona, Zugo, Friburgo, Soletta, Basilea Città, Basilea Campagna, Sciaffusa, Appenzello Esterno, Appenzello Interno, San Gallo, Grigioni, Argovia, Turgovia, Ticino, Vaud, Vallese, Neuchâtel, Ginevra e Giura — sulla base del diritto fiscale cantonale e dei moltiplicatori comunali attualmente in vigore. Gli importi delle deduzioni seguono ovunque lo schema federale (le regole di deduzione proprie dei cantoni differiscono ma non sono modellate qui); le deduzioni effettivamente applicate sono sempre indicate. I confini comunali provengono da © swisstopo / BFS GEOSTAT (swiss-maps), uso non commerciale con citazione della fonte.",
    en: 'Federal tax figures follow the official 2026 ESTV tariff and deductions. Cantonal/communal/church tax is precisely modeled for <strong>all 26 cantons</strong> — Zürich, Bern, Lucerne, Uri, Schwyz, Obwalden, Nidwalden, Glarus, Zug, Fribourg, Solothurn, Basel-Stadt, Basel-Landschaft, Schaffhausen, Appenzell Ausserrhoden, Appenzell Innerrhoden, St. Gallen, Graubünden, Aargau, Thurgau, Ticino, Vaud, Valais, Neuchâtel, Geneva and Jura — from each canton\'s own current tax law and municipal multiplier tables. Deduction amounts use the federal schedule everywhere (cantons\' own deduction rules differ but aren\'t modeled here); the deductions actually applied are always shown. Boundaries are © swisstopo / BFS GEOSTAT (swiss-maps), non-commercial use with attribution.',
  },
  nonCommunalHint: {
    de: '{name} hat keine eigene Steuerhoheit — wählen Sie stattdessen eine nahegelegene Gemeinde.',
    fr: "{name} n'a pas de juridiction fiscale propre — choisissez plutôt une commune voisine.",
    it: '{name} non ha una propria giurisdizione fiscale — scegli invece un comune vicino.',
    en: '{name} has no tax jurisdiction of its own — pick a nearby town or village instead.',
  },
  mapLoadError: {
    de: 'Kartendaten konnten nicht geladen werden. Führen Sie zuerst <code>npm run prep:boundaries</code> aus.',
    fr: "Impossible de charger les données cartographiques. Exécutez d'abord <code>npm run prep:boundaries</code>.",
    it: 'Impossibile caricare i dati della mappa. Esegui prima <code>npm run prep:boundaries</code>.',
    en: 'Failed to load map data. Run <code>npm run prep:boundaries</code> first.',
  },
  resultsEmptyHint: {
    de: 'Geben Sie Ihre Angaben ein und wählen Sie eine Gemeinde auf der Karte, um eine Schätzung zu erhalten.',
    fr: 'Saisissez vos informations et choisissez une commune sur la carte pour voir une estimation.',
    it: 'Inserisci i tuoi dati e scegli un comune sulla mappa per vedere una stima.',
    en: 'Enter your details and pick a municipality on the map to see an estimate.',
  },
  locationNoneSelected: {
    de: 'Keine Gemeinde ausgewählt',
    fr: 'Aucune commune sélectionnée',
    it: 'Nessun comune selezionato',
    en: 'No municipality selected',
  },
  locationNonCommunalHint: {
    de: 'Keine Wohngemeinde — dies ist unbewohnter Staatswald bzw. gemeindeübergreifendes Gebiet ohne eigene Steuerhoheit. Wählen Sie stattdessen eine nahegelegene Gemeinde.',
    fr: "Ce n'est pas une commune résidentielle — il s'agit de forêt domaniale inhabitée ou de territoire intercommunal sans juridiction fiscale propre. Choisissez plutôt une commune voisine.",
    it: 'Non è un comune residenziale — si tratta di foresta demaniale disabitata o territorio intercomunale senza una propria giurisdizione fiscale. Scegli invece un comune vicino.',
    en: 'Not a residential municipality — this is uninhabited state forest / shared inter-communal land with no tax jurisdiction of its own. Pick a nearby town or village instead.',
  },
  mobilePeekHint: {
    de: 'Tippen, um eine Gemeinde zu suchen & Angaben einzugeben',
    fr: 'Touchez pour rechercher une commune et saisir vos informations',
    it: 'Tocca per cercare un comune e inserire i dati',
    en: 'Tap to search a municipality & enter details',
  },
  searchPlaceholder: {
    de: 'Gemeinde suchen…',
    fr: 'Rechercher une commune…',
    it: 'Cerca un comune…',
    en: 'Search municipality…',
  },
  formLegend: {
    de: 'Haushalt, Einkommen & Vermögen (CHF)',
    fr: 'Ménage, revenu et fortune (CHF)',
    it: 'Nucleo familiare, reddito e sostanza (CHF)',
    en: 'Household, Income & Wealth (CHF)',
  },
  maritalStatusLabel: {
    de: 'Zivilstand',
    fr: 'État civil',
    it: 'Stato civile',
    en: 'Marital status',
  },
  maritalSingle: {
    de: 'Ledig',
    fr: 'Célibataire',
    it: 'Celibe/Nubile',
    en: 'Single',
  },
  maritalMarried: {
    de: 'Verheiratet',
    fr: 'Marié(e)',
    it: 'Coniugato/a',
    en: 'Married',
  },
  childrenLabel: {
    de: 'Kinder',
    fr: 'Enfants',
    it: 'Figli',
    en: 'Children',
  },
  incomeLabelSingle: {
    de: 'Steuerbares Einkommen (CHF/Jahr)',
    fr: 'Revenu imposable (CHF/an)',
    it: 'Reddito imponibile (CHF/anno)',
    en: 'Taxable income (CHF/year)',
  },
  incomeLabelMarried: {
    de: 'Ihr Einkommen',
    fr: 'Votre revenu',
    it: 'Il tuo reddito',
    en: 'Your income',
  },
  spouseIncomeLabel: {
    de: 'Einkommen Ehepartner',
    fr: 'Revenu du conjoint',
    it: 'Reddito del coniuge',
    en: "Spouse's income",
  },
  spouseIncomeTitle: {
    de: 'Wird getrennt erfasst, um eine Vorschau der Individualbesteuerung zu ermöglichen.',
    fr: "Saisi séparément afin de pouvoir simuler l'imposition individuelle.",
    it: "Tenuto separato per poter mostrare un'anteprima della tassazione individuale.",
    en: 'Kept separate so we can preview individual/separate taxation.',
  },
  faithLabelSingle: {
    de: 'Konfession (für die Kirchensteuer)',
    fr: "Confession (pour l'impôt ecclésiastique)",
    it: "Confessione (per l'imposta di culto)",
    en: 'Religion (for church tax)',
  },
  faithLabelMarried: {
    de: 'Ihre Konfession',
    fr: 'Votre confession',
    it: 'La tua confessione',
    en: 'Your religion',
  },
  faithNone: {
    de: 'Keine / konfessionslos',
    fr: 'Aucune / sans confession',
    it: 'Nessuna / senza confessione',
    en: 'None / not affiliated',
  },
  faithReformed: {
    de: 'Evangelisch-reformiert',
    fr: 'Réformée (protestante)',
    it: 'Riformata (evangelica)',
    en: 'Reformed (evangelisch-reformiert)',
  },
  faithCatholic: {
    de: 'Römisch-katholisch',
    fr: 'Catholique romaine',
    it: 'Cattolica romana',
    en: 'Roman Catholic',
  },
  spouseFaithLabel: {
    de: 'Konfession Ehepartner',
    fr: 'Confession du conjoint',
    it: 'Confessione del coniuge',
    en: "Spouse's religion",
  },
  spouseFaithTitle: {
    de: 'Die Schweizer Kirchensteuer wird bei unterschiedlichen Konfessionen der Ehepartner 50/50 aufgeteilt, statt eine gemeinsame Haushaltskonfession zu verwenden.',
    fr: "L'impôt ecclésiastique suisse est réparti à parts égales (50/50) entre conjoints de confessions différentes, plutôt que d'utiliser une confession unique pour le ménage.",
    it: "L'imposta di culto svizzera viene suddivisa 50/50 tra coniugi di confessioni diverse, invece di usare un'unica confessione per il nucleo familiare.",
    en: 'Swiss church tax splits 50/50 between spouses of differing confessions, rather than using one shared household faith.',
  },
  wealthLabel: {
    de: 'Steuerbares Vermögen (CHF)',
    fr: 'Fortune imposable (CHF)',
    it: 'Sostanza imponibile (CHF)',
    en: 'Taxable wealth (CHF)',
  },
  resultsTotalLabel: {
    de: 'Geschätzte Gesamtsteuer',
    fr: 'Impôt total estimé',
    it: 'Imposta totale stimata',
    en: 'Estimated total tax',
  },
  resultsTotalSub: {
    de: '{pct} des Bruttoeinkommens',
    fr: '{pct} du revenu brut',
    it: '{pct} del reddito lordo',
    en: '{pct} of gross income',
  },
  badgeApprox: {
    de: 'Näherungswert — das genaue kantonale Steuerrecht ist für diesen Kanton noch nicht modelliert',
    fr: "Approximatif — le droit fiscal cantonal précis n'est pas encore modélisé pour ce canton",
    it: 'Approssimativo — il diritto fiscale cantonale preciso non è ancora modellato per questo cantone',
    en: 'Approximate — precise cantonal tax law not yet modeled for this canton',
  },
  badgePrecise: {
    de: 'Basiert auf modelliertem kantonalem Steuerrecht',
    fr: 'Basé sur le droit fiscal cantonal modélisé',
    it: 'Basato sul diritto fiscale cantonale modellato',
    en: 'Based on modeled cantonal tax law',
  },
  tableComponent: {
    de: 'Position',
    fr: 'Élément',
    it: 'Componente',
    en: 'Component',
  },
  tableBase: {
    de: 'Basis',
    fr: 'Base',
    it: 'Base',
    en: 'Base',
  },
  tableRate: {
    de: 'Satz',
    fr: 'Taux',
    it: 'Aliquota',
    en: 'Rate',
  },
  tableAmount: {
    de: 'Betrag',
    fr: 'Montant',
    it: 'Importo',
    en: 'Amount',
  },
  deductionsSummary: {
    de: 'Angewendete Abzüge (insgesamt {amount})',
    fr: 'Déductions appliquées ({amount} au total)',
    it: 'Deduzioni applicate (totale {amount})',
    en: 'Deductions applied ({amount} total)',
  },
  deductionsHint: {
    de: 'Die Abzugsbeträge folgen in dieser Vorschau für alle Kantone dem Bundesschema, auch wenn die eigenen Regeln eines Kantons abweichen — nur die Steuersätze selbst sind kantonsspezifisch.',
    fr: "Dans cet aperçu, les montants des déductions suivent le barème fédéral pour tous les cantons, même lorsque les règles propres à un canton diffèrent — seuls les taux d'imposition sont spécifiques au canton.",
    it: 'In questa anteprima gli importi delle deduzioni seguono lo schema federale per tutti i cantoni, anche laddove le regole proprie di un cantone differiscano — solo le aliquote fiscali sono specifiche del cantone.',
    en: "Deduction amounts use the federal schedule for all cantons in this preview, even where a canton's own rules differ — only the tax rates themselves are canton-specific.",
  },
  separateTaxationTitle: {
    de: 'Vorschau: Individualbesteuerung',
    fr: 'Aperçu : imposition individuelle',
    it: 'Anteprima: tassazione individuale',
    en: 'Preview: individual/separate taxation',
  },
  separateTaxationHint: {
    de: 'Die Schweiz kennt noch keine getrennte Besteuerung von Ehepartnern — dies ist eine Simulation einer vorgeschlagenen Reform ohne endgültige offizielle Formel. Dabei wird jeder Ehepartner einzeln auf sein eigenes Einkommen besteuert (Vermögen wird hälftig aufgeteilt) und anschliessend addiert.',
    fr: "La Suisse ne connaît pas encore l'imposition séparée des conjoints — il s'agit d'une simulation d'une réforme proposée, sans formule officielle définitive. Chaque conjoint est imposé individuellement sur son propre revenu (la fortune est répartie à parts égales), puis les montants sont additionnés.",
    it: "La Svizzera non prevede ancora la tassazione separata dei coniugi — questa è una simulazione di una riforma proposta, senza una formula ufficiale definitiva. Ogni coniuge viene tassato individualmente sul proprio reddito (la sostanza è ripartita in parti uguali), poi i valori vengono sommati.",
    en: 'Switzerland does not yet have separate taxation of spouses — this is a simulation of a proposed reform with no finalized official formula. It models each spouse being taxed individually on their own income (wealth split evenly), then summed.',
  },
  currentJointTaxation: {
    de: 'Aktuelle gemeinsame Besteuerung',
    fr: 'Imposition commune actuelle',
    it: 'Tassazione congiunta attuale',
    en: 'Current joint taxation',
  },
  simulatedSeparateTaxation: {
    de: 'Simulierte getrennte Besteuerung',
    fr: 'Imposition séparée simulée',
    it: 'Tassazione separata simulata',
    en: 'Simulated separate taxation',
  },
  difference: {
    de: 'Differenz',
    fr: 'Différence',
    it: 'Differenza',
    en: 'Difference',
  },
  directionLess: {
    de: 'weniger',
    fr: 'de moins',
    it: 'in meno',
    en: 'less',
  },
  directionMore: {
    de: 'mehr',
    fr: 'de plus',
    it: 'in più',
    en: 'more',
  },
  directionSame: {
    de: 'gleich viel',
    fr: 'la même chose',
    it: 'lo stesso importo',
    en: 'the same',
  },

  // --- tax breakdown labels & warnings (generated by src/tax/lib and the
  // canton modules under src/tax/ch/*) ---
  labelFederalTax: {
    de: 'Direkte Bundessteuer',
    fr: 'Impôt fédéral direct',
    it: 'Imposta federale diretta',
    en: 'Federal tax (direkte Bundessteuer)',
  },
  labelCantonalTax: {
    de: 'Kantonssteuer ({code})',
    fr: 'Impôt cantonal ({code})',
    it: 'Imposta cantonale ({code})',
    en: 'Cantonal tax ({code})',
  },
  labelCantonalIncomeTax: {
    de: 'Kantonssteuer Einkommen ({code})',
    fr: 'Impôt cantonal sur le revenu ({code})',
    it: 'Imposta cantonale sul reddito ({code})',
    en: 'Cantonal income tax ({code})',
  },
  labelCantonalWealthTax: {
    de: 'Kantonssteuer Vermögen ({code})',
    fr: 'Impôt cantonal sur la fortune ({code})',
    it: 'Imposta cantonale sulla sostanza ({code})',
    en: 'Cantonal wealth tax ({code})',
  },
  labelMunicipalTax: {
    de: 'Gemeindesteuer ({name})',
    fr: 'Impôt communal ({name})',
    it: 'Imposta comunale ({name})',
    en: 'Municipal tax ({name})',
  },
  labelMunicipalTaxInclSchool: {
    de: 'Gemeindesteuer ({name}, inkl. Schule)',
    fr: 'Impôt communal ({name}, école incluse)',
    it: 'Imposta comunale ({name}, scuola inclusa)',
    en: 'Municipal tax ({name}, incl. school)',
  },
  labelMunicipalIncomeTax: {
    de: 'Gemeindesteuer Einkommen ({name})',
    fr: 'Impôt communal sur le revenu ({name})',
    it: 'Imposta comunale sul reddito ({name})',
    en: 'Municipal income tax ({name})',
  },
  labelMunicipalWealthTax: {
    de: 'Gemeindesteuer Vermögen ({name})',
    fr: 'Impôt communal sur la fortune ({name})',
    it: 'Imposta comunale sulla sostanza ({name})',
    en: 'Municipal wealth tax ({name})',
  },
  labelDistrictTax: {
    de: 'Bezirkssteuer ({district})',
    fr: 'Impôt de district ({district})',
    it: 'Imposta distrettuale ({district})',
    en: 'District tax ({district})',
  },
  labelChurchTax: {
    de: 'Kirchensteuer ({owner}{faith})',
    fr: 'Impôt ecclésiastique ({owner}{faith})',
    it: 'Imposta di culto ({owner}{faith})',
    en: 'Church tax ({owner}{faith})',
  },
  labelChurchTaxIncomeOnly: {
    de: 'Kirchensteuer ({owner}{faith}, nur Einkommen)',
    fr: 'Impôt ecclésiastique ({owner}{faith}, revenu uniquement)',
    it: 'Imposta di culto ({owner}{faith}, solo reddito)',
    en: 'Church tax ({owner}{faith}, income only)',
  },
  labelChurchIncomeTax: {
    de: 'Kirchensteuer Einkommen ({owner}{faith})',
    fr: "Impôt ecclésiastique sur le revenu ({owner}{faith})",
    it: 'Imposta di culto sul reddito ({owner}{faith})',
    en: 'Church income tax ({owner}{faith})',
  },
  labelChurchWealthTax: {
    de: 'Kirchensteuer Vermögen ({owner}{faith})',
    fr: "Impôt ecclésiastique sur la fortune ({owner}{faith})",
    it: 'Imposta di culto sulla sostanza ({owner}{faith})',
    en: 'Church wealth tax ({owner}{faith})',
  },
  labelChurchTaxReformedLandeskirche: {
    de: 'Kirchensteuer ({owner}reformiert, lokal + kantonale Landeskirche)',
    fr: 'Impôt ecclésiastique ({owner}réformée, paroisse + Église cantonale)',
    it: 'Imposta di culto ({owner}riformata, locale + Chiesa cantonale)',
    en: 'Church tax ({owner}reformed, local + cantonal Landeskirche)',
  },
  labelSupplementaryWealthTax: {
    de: 'Zusatzvermögenssteuer ({code}, ohne Steuerfuss)',
    fr: 'Impôt supplémentaire sur la fortune ({code}, sans coefficient)',
    it: 'Imposta supplementare sulla sostanza ({code}, senza moltiplicatore)',
    en: 'Supplementary wealth tax ({code}, no multiplier applies)',
  },
  labelGenericApprox: {
    de: 'Kantons-, Gemeinde- und Kirchensteuer (Näherung — generisches Modell)',
    fr: 'Impôt cantonal, communal et ecclésiastique (approximatif — modèle générique)',
    it: 'Imposta cantonale, comunale ed ecclesiastica (approssimativa — modello generico)',
    en: 'Cantonal + communal + church tax (approximate — generic model)',
  },
  faithReformedShort: {
    de: 'reformiert',
    fr: 'réformée',
    it: 'riformata',
    en: 'reformed',
  },
  faithCatholicShort: {
    de: 'katholisch',
    fr: 'catholique',
    it: 'cattolica',
    en: 'catholic',
  },
  churchOwnerYou: {
    de: 'Sie, ',
    fr: 'vous, ',
    it: 'tu, ',
    en: 'you, ',
  },
  churchOwnerSpouse: {
    de: 'Ehepartner, ',
    fr: 'conjoint, ',
    it: 'coniuge, ',
    en: 'spouse, ',
  },
  labelChildDeduction: {
    de: 'Kinderabzug × {n}',
    fr: 'Déduction pour enfant × {n}',
    it: 'Deduzione per figli × {n}',
    en: 'Child deduction × {n}',
  },
  labelInsurancePremiumDeduction: {
    de: 'Versicherungsprämienabzug',
    fr: "Déduction pour primes d'assurance",
    it: 'Deduzione premi assicurativi',
    en: 'Insurance premium deduction',
  },
  labelInsuranceDeductionPerChild: {
    de: 'Versicherungsabzug pro Kind × {n}',
    fr: 'Déduction d\'assurance par enfant × {n}',
    it: 'Deduzione assicurativa per figlio × {n}',
    en: 'Insurance deduction per child × {n}',
  },
  labelMarriedCoupleDeduction: {
    de: 'Verheiratetenabzug',
    fr: 'Déduction pour couple marié',
    it: 'Deduzione per coniugi',
    en: 'Married-couple deduction (Verheiratetenabzug)',
  },
  labelTwoEarnerDeduction: {
    de: 'Zweitverdienerabzug',
    fr: 'Déduction pour double revenu',
    it: 'Deduzione per doppio reddito',
    en: 'Two-earner deduction',
  },
  labelParentTaxCredit: {
    de: 'Elterntarif-Gutschrift × {n}',
    fr: "Crédit d'impôt parental (barème parental) × {n}",
    it: "Credito d'imposta per genitori (tariffa genitori) × {n}",
    en: 'Parent tax credit (Elterntarif) × {n}',
  },
  warningJuMunicipal: {
    de: '{name} wechselte 2026 vom Kanton Bern zum Kanton Jura und hat noch keinen bestätigten Gemeindesteuerfuss — hier wird ein Schätzwert verwendet, gemittelt aus den anderen Bezirkshauptorten des Kantons Jura (Delémont, Porrentruy).',
    fr: "{name} est passée du canton de Berne au canton du Jura en 2026 et n'a pas encore de quotité communale confirmée — une estimation (moyenne des autres chefs-lieux de district jurassiens : Delémont, Porrentruy) est utilisée ici.",
    it: '{name} è passata dal canton Berna al canton Giura nel 2026 e non dispone ancora di un moltiplicatore comunale confermato — viene usata una stima (media degli altri capoluoghi di distretto del Giura: Delémont, Porrentruy).',
    en: "{name} transferred from canton Bern to Jura in 2026 and has no confirmed municipal tax rate yet — this uses an estimate averaged from JU's other district-capital towns (Delémont, Porrentruy).",
  },
  warningJuChurch: {
    de: '{name} hat noch keinen bestätigten katholischen Kirchensteuersatz — hier wird ein Schätzwert verwendet, gemittelt aus den anderen Bezirkshauptorten des Kantons Jura.',
    fr: "{name} n'a pas encore de taux d'impôt ecclésiastique catholique confirmé — une estimation (moyenne des autres chefs-lieux de district jurassiens) est utilisée ici.",
    it: "{name} non dispone ancora di un'aliquota d'imposta di culto cattolica confermata — viene usata una stima (media degli altri capoluoghi di distretto del Giura).",
    en: "{name} has no confirmed catholic church tax rate yet — this uses an estimate averaged from JU's other district-capital towns.",
  },
  warningSgMunicipal: {
    de: 'Der Gemeindesteuerfuss 2026 von {name} steht noch nicht fest — eine bindende Volksabstimmung (27. September 2026) wird ihn auf 115%, 118% oder 121% festlegen. Bis das Ergebnis feststeht, wird hier ein Schätzwert (Durchschnitt der drei Varianten) verwendet.',
    fr: "La quotité communale 2026 de {name} n'est pas encore définitive — une votation populaire contraignante (27 septembre 2026) la fixera à 115%, 118% ou 121%. En attendant le résultat, une estimation (moyenne des trois propositions) est utilisée ici.",
    it: 'Il moltiplicatore comunale 2026 di {name} non è ancora definitivo — una votazione popolare vincolante (27 settembre 2026) lo fisserà al 115%, 118% o 121%. Fino a quel momento viene usata una stima (media delle tre proposte).',
    en: "{name}'s 2026 municipal tax rate is not yet finalized — a binding referendum (27 Sept 2026) will set it at 115%, 118%, or 121%. This uses an estimate (the average of the three proposals) until the result is known.",
  },
  warningSgChurch: {
    de: 'Auch der Kirchensteuersatz von {name} hängt vom Ergebnis derselben Abstimmung ab — hier wird als Platzhalter der Bezirksdurchschnitt verwendet.',
    fr: "Le taux d'impôt ecclésiastique de {name} dépend lui aussi du résultat de la même votation — la moyenne du district est utilisée ici comme valeur provisoire.",
    it: "Anche l'aliquota d'imposta di culto di {name} dipende dall'esito della stessa votazione — come valore provvisorio viene usata la media distrettuale.",
    en: "{name}'s church tax rate is also pending the same referendum outcome — this uses the district average as a placeholder.",
  },
  warningFrMunicipal: {
    de: '{name} entstand 2025 durch eine Gemeindefusion und ist im veröffentlichten Gemeindekoeffizienten-Datensatz 2026 des Kantons noch nicht enthalten — hier wird ein Schätzwert verwendet (Durchschnitt der letzten bekannten Sätze der beiden Vorgängergemeinden).',
    fr: "{name} est issue d'une fusion de communes en 2025 et ne figure pas encore dans le jeu de données 2026 des coefficients communaux publié par le canton — une estimation (moyenne des derniers taux connus de ses deux communes d'origine) est utilisée ici.",
    it: "{name} è nata da una fusione di comuni nel 2025 e non figura ancora nel set di dati 2026 dei coefficienti comunali pubblicato dal cantone — viene usata una stima (media delle ultime aliquote note dei due comuni d'origine).",
    en: "{name} was formed by a 2025 merger and isn't in the canton's published 2026 commune-coefficient dataset yet — this uses an estimate (the average of its two predecessor communes' last known rates).",
  },
} satisfies Record<string, Record<Locale, string>>

export type TranslationKey = keyof typeof translations

/** Looks up `key` in the current locale (see i18n.ts), substituting any
 * `{param}` placeholders from `params`. */
export function t(key: TranslationKey, params?: Record<string, string>): string {
  let str: string = translations[key][getLocale()]
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, v)
    }
  }
  return str
}
