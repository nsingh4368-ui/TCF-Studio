// ============ AI ANALYSIS MODULE - Claude API ============

async function runAIAnalysis() {
    const text = editor.value.trim();
    if (!text) {
        alert('Pas de texte à analyser.');
        return;
    }
    
    const taskNum = activeTask || 1;
    const limits = ['60-120 mots', '120-150 mots', '180 mots maximum'];
    const taskLimit = limits[taskNum - 1];
    
    const combo = combos[activeCombIdx];
    const consigne = combo ? (
        taskNum === 1 ? combo.t1?.consigne :
        taskNum === 2 ? combo.t2?.consigne :
        combo.t3?.titre
    ) || '' : '';
    
    const prompt = `Tu es un correcteur expert du TCF (Test de Connaissance du Français) niveau B2.
Analyse ce texte d'Expression Écrite (Tâche ${taskNum}, limite : ${taskLimit}).

${consigne ? 'Sujet : ' + consigne + '\n\n' : ''}
Texte de l'étudiant :
"""
${text}
"""

Donne une analyse structurée avec ces sections :

1. 🎯 ADÉQUATION AU SUJET — le texte répond-il bien à la consigne ?
2. 📐 STRUCTURE — introduction, développement, conclusion, paragraphes
3. 🔗 COHÉRENCE & CONNECTEURS — liens logiques, fluidité
4. 📚 RICHESSE LEXICALE — vocabulaire B2, synonymes, mots répétés
5. ✏️ GRAMMAIRE — fautes potentielles, structures complexes
6. 💡 3 CONSEILS PRIORITAIRES — points à améliorer
7. ⭐ NIVEAU ESTIMÉ — B1 / B1+ / B2 / B2+ avec justification

Sois bienveillant mais précis. Cite des extraits du texte.`;

    const pane = document.getElementById('analysis-ai-pane');
    if (!pane) return;
    
    pane.innerHTML = '<div class="ai-analysis-loading"><div class="ai-spinner"></div>Analyse en cours...</div>';
    
    try {
        // Note: This requires a proxy or API key. For demo, show simulation
        simulateAIAnalysis(pane, text);
    } catch (err) {
        pane.innerHTML = `<div class="an-item"><span class="an-badge">⚠️</span><div class="an-text"><strong>Erreur</strong><span>${escHtml(err.message)}</span></div></div>`;
    }
}

function simulateAIAnalysis(pane, text) {
    // Simulated response for demo (since API requires key)
    const wordCount = wcOf(text);
    const hasConnectors = text.includes('cependant') || text.includes('donc') || text.includes('en effet');
    const hasOpinion = text.includes('à mon avis') || text.includes('je pense');
    
    setTimeout(() => {
        pane.innerHTML = `
            <div class="ai-analysis-box">
                <strong>🤖 Analyse IA (simulation)</strong><br><br>
                <strong>1. 🎯 ADÉQUATION AU SUJET</strong><br>
                ${wordCount > 50 ? '✅ Le texte répond globalement à la consigne.' : '⚠️ Le texte est un peu court.'}<br><br>
                <strong>2. 📐 STRUCTURE</strong><br>
                ${text.split('\n').length > 2 ? '✅ Structure avec plusieurs paragraphes.' : '⚠️ Structure à améliorer.'}<br><br>
                <strong>3. 🔗 COHÉRENCE & CONNECTEURS</strong><br>
                ${hasConnectors ? '✅ Utilisation de connecteurs.' : '⚠️ Ajoutez des connecteurs (cependant, donc, en effet).'}<br><br>
                <strong>4. 📚 RICHESSE LEXICALE</strong><br>
                ${wordCount > 80 ? '✅ Bonne longueur.' : '⚠️ Essayez d\'étoffer votre texte.'}<br><br>
                <strong>5. ✏️ GRAMMAIRE</strong><br>
                Relisez les accords et la conjugaison.<br><br>
                <strong>6. 💡 3 CONSEILS PRIORITAIRES</strong><br>
                1. Vérifiez les accords des participes passés<br>
                2. Utilisez des connecteurs logiques (cependant, par conséquent)<br>
                3. Structurez votre texte en paragraphes clairs<br><br>
                <strong>7. ⭐ NIVEAU ESTIMÉ</strong><br>
                ${wordCount > 100 ? 'B2' : 'B1'} — Continuez à vous entraîner !
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:10px" onclick="runAIAnalysis()">🔄 Relancer l'analyse</button>
        `;
    }, 1500);
}

function showAnalysisTab(tab) {
    const localPane = document.getElementById('analysis-local-pane');
    const aiPane = document.getElementById('analysis-ai-pane');
    if (localPane) localPane.style.display = tab === 'local' ? 'block' : 'none';
    if (aiPane) aiPane.style.display = tab === 'ai' ? 'block' : 'none';
}
