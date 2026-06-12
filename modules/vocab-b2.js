// TCF EE Studio X - B2 Vocabulary (80+ words with themes)
// Organized by themes for better learning

const TCF_THEMES = [
  "Travail", "Éducation", "Environnement", "Technologie", 
  "Santé", "Société", "Économie", "Culture"
];

const B2_VOCAB = [
  // Société / Social
  ["enjeu", "issue, stake", "Société"],
  ["défi", "challenge", "Société"],
  ["atout", "asset", "Société"],
  ["précarité", "insecurity, precariousness", "Société"],
  ["mixité sociale", "social diversity", "Société"],
  ["discrimination", "discrimination", "Société"],
  ["intégration", "integration", "Société"],
  ["exclusion", "exclusion", "Société"],
  ["citoyenneté", "citizenship", "Société"],
  ["solidarité", "solidarity", "Société"],
  
  // Travail / Employment
  ["carrière", "career", "Travail"],
  ["embauche", "hiring", "Travail"],
  ["recrutement", "recruitment", "Travail"],
  ["compétence", "skill", "Travail"],
  ["qualification", "qualification", "Travail"],
  ["métier", "profession, trade", "Travail"],
  ["poste", "position, job", "Travail"],
  ["salaire", "salary", "Travail"],
  ["rémunération", "remuneration", "Travail"],
  ["chômage", "unemployment", "Travail"],
  ["débouché", "opportunity, outlet", "Travail"],
  ["évolution", "progression", "Travail"],
  
  // Éducation
  ["apprentissage", "learning", "Éducation"],
  ["formation", "training", "Éducation"],
  ["diplôme", "degree", "Éducation"],
  ["parcours", "path, journey", "Éducation"],
  ["pédagogie", "pedagogy", "Éducation"],
  ["orientation", "guidance", "Éducation"],
  ["évaluation", "assessment", "Éducation"],
  ["connaissance", "knowledge", "Éducation"],
  ["savoir-faire", "know-how", "Éducation"],
  
  // Environnement
  ["développement durable", "sustainable development", "Environnement"],
  ["empreinte carbone", "carbon footprint", "Environnement"],
  ["biodiversité", "biodiversity", "Environnement"],
  ["recyclage", "recycling", "Environnement"],
  ["pollution", "pollution", "Environnement"],
  ["éco-geste", "eco-gesture", "Environnement"],
  ["énergies renouvelables", "renewable energy", "Environnement"],
  ["changement climatique", "climate change", "Environnement"],
  ["déforestation", "deforestation", "Environnement"],
  ["écosystème", "ecosystem", "Environnement"],
  ["préservation", "preservation", "Environnement"],
  
  // Technologie
  ["numérique", "digital", "Technologie"],
  ["innovation", "innovation", "Technologie"],
  ["intelligence artificielle", "artificial intelligence", "Technologie"],
  ["réseaux sociaux", "social networks", "Technologie"],
  ["données", "data", "Technologie"],
  ["cybersécurité", "cybersecurity", "Technologie"],
  ["applications", "applications", "Technologie"],
  ["connectivité", "connectivity", "Technologie"],
  
  // Santé
  ["bien-être", "well-being", "Santé"],
  ["alimentation", "nutrition", "Santé"],
  ["prévention", "prevention", "Santé"],
  ["médicament", "medication", "Santé"],
  ["traitement", "treatment", "Santé"],
  ["sédentarité", "sedentary lifestyle", "Santé"],
  ["stress", "stress", "Santé"],
  ["épuisement", "burnout, exhaustion", "Santé"],
  ["maladie", "illness", "Santé"],
  
  // Économie
  ["croissance", "growth", "Économie"],
  ["investissement", "investment", "Économie"],
  ["consommation", "consumption", "Économie"],
  ["pouvoir d'achat", "purchasing power", "Économie"],
  ["inflation", "inflation", "Économie"],
  ["crise", "crisis", "Économie"],
  ["entreprise", "company", "Économie"],
  ["commerce", "trade, commerce", "Économie"],
  ["marché", "market", "Économie"],
  ["concurrence", "competition", "Économie"],
  
  // Verbs & Expressions (General)
  ["susciter", "to arouse, generate", "Société"],
  ["engendrer", "to cause, engender", "Société"],
  ["favoriser", "to promote, favor", "Société"],
  ["nuire à", "to harm", "Société"],
  ["constater", "to observe, note", "Société"],
  ["envisager", "to consider", "Société"],
  ["privilégier", "to favor, prioritize", "Société"],
  ["renforcer", "to strengthen", "Société"],
  ["contribuer à", "to contribute to", "Société"],
  ["entraîner", "to lead to", "Société"],
  ["démontrer", "to demonstrate", "Société"],
  ["aborder", "to tackle (a subject)", "Société"],
  ["s'épanouir", "to flourish, thrive", "Société"],
  ["sensibiliser", "to raise awareness", "Société"],
  ["accroître", "to increase", "Société"],
  ["diminuer", "to decrease", "Société"],
  ["remettre en question", "to question", "Société"],
  ["faire face à", "to face", "Société"],
  ["mettre en place", "to implement, set up", "Société"],
  ["tenir compte de", "to take into account", "Société"],
  ["soutenir", "to support", "Société"],
  
  // Adjectives
  ["essentiel", "essential", "Société"],
  ["majeur", "major", "Société"],
  ["considérable", "considerable", "Société"],
  ["bénéfique", "beneficial", "Société"],
  ["néfaste", "harmful", "Société"],
  ["durable", "sustainable", "Environnement"],
  ["équitable", "fair", "Société"],
  ["responsable", "responsible", "Société"],
  ["autonome", "autonomous", "Société"],
  ["précieux", "precious", "Société"],
  ["crucial", "crucial", "Société"],
  
  // Adverbs / Phrases
  ["désormais", "from now on, henceforth", "Société"],
  ["dorénavant", "from now on", "Société"],
  ["notamment", "notably, in particular", "Société"],
  ["en particulier", "in particular", "Société"],
  ["globalement", "globally, overall", "Société"],
  ["vraisemblablement", "probably", "Société"],
  ["effectivement", "indeed", "Société"],
  ["néanmoins", "nevertheless", "Société"]
];

// Group by theme for easy access
const VOCAB_BY_THEME = {};
TCF_THEMES.forEach(theme => {
  VOCAB_BY_THEME[theme] = B2_VOCAB.filter(v => v[2] === theme).map(v => ({ word: v[0], definition: v[1] }));
});

// Word list only (for quick checks)
const B2_VOCAB_WORDS = B2_VOCAB.map(v => v[0]);

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TCF_THEMES, B2_VOCAB, B2_VOCAB_WORDS, VOCAB_BY_THEME };
}
