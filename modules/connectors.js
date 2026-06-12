// TCF EE Studio X - Connecteurs B1/B2 (100+ connectors)
// Categories: Opposition, Addition, Cause, Conséquence, But, Condition, Organisation, Conclusion, Reformulation, Opinion, Temps

const CONNECTORS = [
  ["Opposition / Concession", [
    ["cependant", "however"],
    ["pourtant", "yet"],
    ["néanmoins", "nevertheless"],
    ["toutefois", "however"],
    ["en revanche", "on the other hand"],
    ["par contre", "on the other hand (informal)"],
    ["malgré", "despite (+ noun)"],
    ["bien que", "although (+ subjunctive)"],
    ["même si", "even if"],
    ["quoique", "although (+ subjunctive)"],
    ["certes", "admittedly"],
    ["au contraire", "on the contrary"],
    ["à l'inverse", "conversely"],
    ["tandis que", "whereas"],
    ["alors que", "while"],
    ["en dépit de", "in spite of"],
    ["au lieu de", "instead of"]
  ]],
  ["Addition", [
    ["de plus", "moreover"],
    ["en outre", "furthermore"],
    ["par ailleurs", "besides"],
    ["également", "also"],
    ["d'ailleurs", "besides / moreover"],
    ["d'une part", "on the one hand"],
    ["d'autre part", "on the other hand"],
    ["non seulement… mais aussi", "not only… but also"],
    ["aussi", "also"],
    ["de même", "likewise"],
    ["en complément", "in addition"],
    ["à cela s'ajoute que", "adding to that"]
  ]],
  ["Cause", [
    ["car", "for / because"],
    ["parce que", "because"],
    ["puisque", "since / because"],
    ["comme", "as / since"],
    ["en raison de", "due to"],
    ["à cause de", "because of (negative)"],
    ["grâce à", "thanks to (positive)"],
    ["étant donné que", "given that"],
    ["vu que", "seeing that / since"],
    ["faute de", "for lack of"],
    ["du fait de", "owing to"],
    ["sous prétexte que", "under the pretext that"]
  ]],
  ["Conséquence", [
    ["donc", "therefore"],
    ["par conséquent", "consequently"],
    ["ainsi", "thus"],
    ["c'est pourquoi", "that's why"],
    ["de ce fait", "as a result"],
    ["alors", "so"],
    ["si bien que", "so that"],
    ["en conséquence", "accordingly"],
    ["d'où", "hence"],
    ["du coup", "as a result (informal)"],
    ["de sorte que", "so that"]
  ]],
  ["But", [
    ["afin de", "in order to"],
    ["pour que", "so that (+ subjunctive)"],
    ["de façon à", "so as to"],
    ["dans le but de", "with the aim of"],
    ["de manière à", "in such a way as to"],
    ["en vue de", "with a view to"],
    ["dans l'intention de", "with the intention of"]
  ]],
  ["Condition", [
    ["à condition que", "provided that (+ subjunctive)"],
    ["pourvu que", "provided that (+ subjunctive)"],
    ["à moins que", "unless (+ subjunctive)"],
    ["en cas de", "in case of"],
    ["si jamais", "if ever"],
    ["au cas où", "in case (+ conditional)"],
    ["supposons que", "let's suppose that (+ subjunctive)"],
    ["à supposer que", "assuming that (+ subjunctive)"]
  ]],
  ["Organisation / Chronologie", [
    ["d'abord", "first"],
    ["tout d'abord", "first of all"],
    ["ensuite", "then"],
    ["puis", "then"],
    ["enfin", "finally"],
    ["premièrement", "firstly"],
    ["deuxièmement", "secondly"],
    ["en premier lieu", "in the first place"],
    ["en dernier lieu", "lastly"],
    ["finalement", "in the end"],
    ["dans un premier temps", "firstly"],
    ["dans un second temps", "secondly"],
    ["par la suite", "subsequently"],
    ["ultérieurement", "subsequently"],
    ["entre-temps", "meanwhile"],
    ["au préalable", "beforehand"],
    ["auparavant", "previously"],
    ["dorénavant", "from now on"]
  ]],
  ["Conclusion", [
    ["en conclusion", "in conclusion"],
    ["pour conclure", "to conclude"],
    ["en résumé", "in summary"],
    ["en somme", "in short"],
    ["bref", "in short"],
    ["dans l'ensemble", "overall"],
    ["en définitive", "ultimately"],
    ["tout compte fait", "all considered"],
    ["finalement", "finally / in the end"],
    ["pour terminer", "to finish"]
  ]],
  ["Reformulation / Exemple", [
    ["autrement dit", "in other words"],
    ["c'est-à-dire", "that is"],
    ["par exemple", "for example"],
    ["notamment", "notably"],
    ["en particulier", "in particular"],
    ["surtout", "especially"],
    ["en fait", "in fact"],
    ["en réalité", "in reality"],
    ["à vrai dire", "to tell the truth"],
    ["en d'autres termes", "in other terms"],
    ["soit", "namely"],
    ["à savoir", "namely"]
  ]],
  ["Opinion", [
    ["à mon avis", "in my opinion"],
    ["selon moi", "according to me"],
    ["d'après moi", "in my view"],
    ["il me semble que", "it seems to me that"],
    ["je suis convaincu(e) que", "I am convinced that"],
    ["il est évident que", "it is obvious that"],
    ["on peut considérer que", "one can consider that"],
    ["certains estiment que", "some believe that"],
    ["il est probable que", "it is likely that"],
    ["sans doute", "probably"],
    ["à mon sens", "in my sense"],
    ["pour ma part", "for my part"],
    ["personnellement", "personally"]
  ]],
  ["Temps / Cadre", [
    ["de nos jours", "nowadays"],
    ["actuellement", "currently"],
    ["autrefois", "formerly"],
    ["désormais", "from now on"],
    ["à l'avenir", "in the future"],
    ["en ce qui concerne", "regarding"],
    ["quant à", "as for"],
    ["au sujet de", "concerning"],
    ["en général", "in general"],
    ["la plupart du temps", "most of the time"],
    ["dès que", "as soon as"],
    ["pendant que", "while"],
    ["au moment où", "at the moment when"],
    ["précédemment", "previously"],
    ["simultanément", "simultaneously"]
  ]]
];

// Flat array of all connector words for quick lookup
const ALL_CONN_WORDS = CONNECTORS.flatMap(([cat, list]) => list.map(([word]) => word));

// Specific categories for analysis
const NUANCE_WORDS = ["cependant", "pourtant", "toutefois", "néanmoins", "même si", "malgré", "bien que", "en revanche", "certes", "quoique"];
const CONSEQUENCE_WORDS = ["donc", "par conséquent", "ainsi", "c'est pourquoi", "de ce fait", "en conséquence", "du coup"];
const CONCLUSION_WORDS = ["en conclusion", "pour conclure", "en résumé", "en somme", "bref", "en définitive", "finalement"];
const OPINION_WORDS = ["à mon avis", "selon moi", "d'après moi", "il me semble que", "je suis convaincu", "personnellement", "pour ma part"];
const ORGANIZATION_WORDS = ["d'abord", "tout d'abord", "ensuite", "puis", "enfin", "premièrement", "deuxièmement", "d'une part", "d'autre part"];

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONNECTORS, ALL_CONN_WORDS, NUANCE_WORDS, CONSEQUENCE_WORDS, CONCLUSION_WORDS, OPINION_WORDS, ORGANIZATION_WORDS };
}
