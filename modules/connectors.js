// ============ CONNECTORS MODULE - SRS System ============

const CONNECTORS_DATA = [
    ["Opposition / Concession", [["cependant", "however"], ["pourtant", "yet"], ["néanmoins", "nevertheless"], ["toutefois", "however"], ["en revanche", "on the other hand"], ["par contre", "on the other hand"], ["malgré", "despite"], ["bien que", "although (+subj.)"], ["même si", "even if"], ["quoique", "although (+subj.)"], ["certes", "admittedly"], ["au contraire", "on the contrary"], ["à l'inverse", "conversely"], ["tandis que", "whereas"], ["alors que", "while"], ["en dépit de", "in spite of"], ["au lieu de", "instead of"]]],
    ["Addition", [["de plus", "moreover"], ["en outre", "furthermore"], ["par ailleurs", "besides"], ["également", "also"], ["d'ailleurs", "besides"], ["d'une part", "on the one hand"], ["d'autre part", "on the other hand"], ["non seulement… mais aussi", "not only… but also"], ["aussi", "also"], ["de même", "likewise"]]],
    ["Cause", [["car", "because"], ["parce que", "because"], ["puisque", "since"], ["comme", "as"], ["en raison de", "due to"], ["à cause de", "because of"], ["grâce à", "thanks to"], ["étant donné que", "given that"], ["vu que", "seeing that"], ["faute de", "for lack of"], ["du fait de", "owing to"]]],
    ["Conséquence", [["donc", "therefore"], ["par conséquent", "consequently"], ["ainsi", "thus"], ["c'est pourquoi", "that's why"], ["de ce fait", "as a result"], ["alors", "so"], ["si bien que", "so that"], ["en conséquence", "accordingly"], ["d'où", "hence"], ["du coup", "as a result (fam.)"]]],
    ["But", [["afin de", "in order to"], ["pour que", "so that (+subj.)"], ["de façon à", "so as to"], ["dans le but de", "with the aim of"], ["de manière à", "in such a way as to"], ["en vue de", "with a view to"]]],
    ["Condition", [["à condition que", "provided that"], ["pourvu que", "provided that"], ["à moins que", "unless"], ["en cas de", "in case of"], ["si jamais", "if ever"], ["au cas où", "in case"]]],
    ["Organisation", [["d'abord", "first"], ["tout d'abord", "first of all"], ["ensuite", "then"], ["puis", "then"], ["enfin", "finally"], ["premièrement", "firstly"], ["deuxièmement", "secondly"], ["en premier lieu", "in the first place"], ["en dernier lieu", "lastly"], ["finalement", "in the end"]]],
    ["Conclusion", [["en conclusion", "in conclusion"], ["pour conclure", "to conclude"], ["en résumé", "in summary"], ["en somme", "in short"], ["bref", "in short"], ["dans l'ensemble", "overall"], ["en définitive", "ultimately"], ["tout compte fait", "all considered"]]],
    ["Reformulation / Exemple", [["autrement dit", "in other words"], ["c'est-à-dire", "that is"], ["par exemple", "for example"], ["notamment", "notably"], ["en particulier", "in particular"], ["surtout", "especially"], ["en fait", "in fact"], ["en réalité", "in reality"], ["à vrai dire", "to tell the truth"], ["en d'autres termes", "in other terms"]]],
    ["Opinion", [["à mon avis", "in my opinion"], ["selon moi", "according to me"], ["d'après moi", "in my view"], ["il me semble que", "it seems to me"], ["je suis convaincu(e) que", "I am convinced"], ["il est évident que", "it is obvious"], ["on peut considérer que", "one can consider"], ["certains estiment que", "some believe"], ["il est probable que", "it is likely"], ["sans doute", "probably"]]],
    ["Temps / Cadre", [["de nos jours", "nowadays"], ["actuellement", "currently"], ["autrefois", "formerly"], ["désormais", "from now on"], ["à l'avenir", "in the future"], ["en ce qui concerne", "regarding"], ["quant à", "as for"], ["au sujet de", "concerning"], ["en général", "in general"], ["la plupart du temps", "most of the time"], ["dès que", "as soon as"], ["pendant que", "while"]]]
];

let ALL_CONN = [];
let srsData = LS('tcf_srs', {});
const SRS_INTERVALS = [0, 1, 3, 7, 14, 30];
let srsQueue = [], srsCur = null;

function initConnectors() {
    ALL_CONN = CONNECTORS_DATA.flatMap(([cat, l]) => l.map(([w, g], idx) => ({ id: `${cat}_${idx}`, w, g, cat })));
    buildConnList();
}

function buildConnList() {
    const el = document.getElementById('connListArea');
    if (!el) return;
    el.innerHTML = CONNECTORS_DATA.map(([cat, items]) => `
        <div class="conn-cat">${cat}</div>
        ${items.map(([w, g]) => `<div class="conn-row"><b>${escHtml(w)}</b><span class="muted">${escHtml(g)}</span></div>`).join('')}
    `).join('');
}

function buildSRS() {
    const t = todayStr();
    srsQueue = ALL_CONN.filter(c => {
        const e = srsData[c.id];
        return !e || e.due <= t;
    });
    const area = document.getElementById('srsArea');
    if (!area) return;
    if (!srsQueue.length) {
        const mastered = Object.values(srsData).filter(e => e.box >= 4).length;
        area.innerHTML = `<div class="empty-state">🎉 ${mastered}/${ALL_CONN.length} connecteurs maîtrisés! Revenez demain.</div>`;
        return;
    }
    srsNext();
}

function srsNext() {
    const area = document.getElementById('srsArea');
    if (!area) return;
    if (!srsQueue.length) { buildSRS(); return; }
    srsCur = srsQueue.shift();
    area.innerHTML = `
        <div class="muted">${srsQueue.length + 1} carte(s) · ${escHtml(srsCur.cat)}</div>
        <div class="flashcard" onclick="this.classList.toggle('flipped')">
            <div class="flash-inner">
                <div class="flash-f">${escHtml(srsCur.w)}</div>
                <div class="flash-b"><b>${escHtml(srsCur.g)}</b></div>
            </div>
        </div>
        <div class="srs-actions">
            <button class="btn btn-ghost btn-sm" onclick="srsAnswer(false)">❌ À revoir</button>
            <button class="btn btn-primary btn-sm" onclick="srsAnswer(true)">✅ Je connais</button>
        </div>
    `;
}

function srsAnswer(known) {
    const e = srsData[srsCur.id] || { box: 0, due: '' };
    e.box = known ? Math.min(e.box + 1, 5) : Math.max(e.box - 1, 0);
    const d = new Date();
    d.setDate(d.getDate() + SRS_INTERVALS[e.box]);
    e.due = d.toISOString().slice(0, 10);
    srsData[srsCur.id] = e;
    SV('tcf_srs', srsData);
    srsNext();
}

function initConnectorsView() {
    initConnectors();
    buildSRS();
}
