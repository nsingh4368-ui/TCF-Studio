// ============ ADVANCED STATISTICS MODULE ============

function buildAdvancedStats() {
    const totalProductions = productions.length;
    const totalWords = productions.reduce((sum, p) => sum + (p.words || 0), 0);
    const avgWords = totalProductions > 0 ? Math.round(totalWords / totalProductions) : 0;
    
    const byTask = [1, 2, 3].map(n => productions.filter(p => p.task === n).length);
    const byConfidence = {
        low: productions.filter(p => p.confidence === '😬').length,
        medium: productions.filter(p => p.confidence === '🙂').length,
        high: productions.filter(p => p.confidence === '😎').length
    };
    
    const topics = {};
    productions.forEach(p => { topics[p.topic] = (topics[p.topic] || 0) + 1; });
    const topTopics = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    const html = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-val">${totalProductions}</div>
                <div class="stat-label">📄 Productions</div>
            </div>
            <div class="stat-card">
                <div class="stat-val">${totalWords}</div>
                <div class="stat-label">📝 Mots rédigés</div>
            </div>
            <div class="stat-card">
                <div class="stat-val">${avgWords}</div>
                <div class="stat-label">📊 Moy. mots/prod</div>
            </div>
        </div>
        
        <div class="an-title">📈 Répartition par tâche</div>
        <div class="bar-row"><span class="lbl">Tâche 1</span><div class="bar-wrap"><div class="bar-fill" style="width:${byTask[0] / Math.max(1, Math.max(...byTask)) * 100}%"></div></div><b>${byTask[0]}</b></div>
        <div class="bar-row"><span class="lbl">Tâche 2</span><div class="bar-wrap"><div class="bar-fill" style="width:${byTask[1] / Math.max(1, Math.max(...byTask)) * 100}%"></div></div><b>${byTask[1]}</b></div>
        <div class="bar-row"><span class="lbl">Tâche 3</span><div class="bar-wrap"><div class="bar-fill" style="width:${byTask[2] / Math.max(1, Math.max(...byTask)) * 100}%"></div></div><b>${byTask[2]}</b></div>
        
        <div class="an-title">😊 Niveau de confiance</div>
        <div class="bar-row"><span class="lbl">😬 Faible</span><div class="bar-wrap"><div class="bar-fill" style="width:${byConfidence.low / Math.max(1, totalProductions) * 100}%;background:var(--danger)"></div></div><b>${byConfidence.low}</b></div>
        <div class="bar-row"><span class="lbl">🙂 Moyen</span><div class="bar-wrap"><div class="bar-fill" style="width:${byConfidence.medium / Math.max(1, totalProductions) * 100}%;background:var(--warn)"></div></div><b>${byConfidence.medium}</b></div>
        <div class="bar-row"><span class="lbl">😎 Élevé</span><div class="bar-wrap"><div class="bar-fill" style="width:${byConfidence.high / Math.max(1, totalProductions) * 100}%;background:var(--success)"></div></div><b>${byConfidence.high}</b></div>
        
        <div class="an-title">🏆 Thèmes les plus pratiqués</div>
        ${topTopics.map(([t, c]) => `<div class="bar-row"><span class="lbl">${escHtml(t)}</span><div class="bar-wrap"><div class="bar-fill" style="width:${c / Math.max(1, topTopics[0]?.[1] || 1) * 100}%"></div></div><b>${c}</b></div>`).join('')}
    `;
    
    const statsContainer = document.querySelector('#view-stats .stats-grid');
    if (statsContainer) {
        statsContainer.innerHTML = html;
    }
}

// Override original buildStats
const originalBuildStats = buildStats;
window.buildStats = function() {
    originalBuildStats();
    buildAdvancedStats();
};
