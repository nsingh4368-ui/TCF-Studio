// ============ FULL BACKUP MODULE ============

function downloadFullBackup() {
    const backup = {
        version: '1.0',
        date: new Date().toISOString(),
        data: {
            productions: productions,
            vocabList: vocabList,
            myErrors: myErrors,
            favorites: favorites,
            revisits: revisits,
            history: history,
            profile: profile,
            streak: streak,
            customBank: customBank
        }
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    dl(blob, `TCF_backup_${todayStr()}.json`);
    saveHistory('💾 Sauvegarde complète téléchargée');
}

function restoreFromBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt';
    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                const data = backup.data || backup;
                
                if (data.productions) { productions = data.productions; SV('tcf_productions', productions); }
                if (data.vocabList) { vocabList = data.vocabList; SV('tcf_vocab', vocabList); }
                if (data.myErrors) { myErrors = data.myErrors; SV('tcf_errors', myErrors); }
                if (data.favorites) { favorites = data.favorites; SV('tcf_favorites', favorites); }
                if (data.revisits) { revisits = data.revisits; SV('tcf_revisits', revisits); }
                if (data.history) { history = data.history; SV('tcf_history', history); }
                if (data.profile) { profile = data.profile; SV('tcf_profile', profile); }
                if (data.streak) { streak = data.streak; SV('tcf_streak', streak); }
                if (data.customBank) { customBank = data.customBank; SV('tcf_custom_bank', customBank); }
                
                alert('✅ Restauration réussie ! La page va se recharger.');
                location.reload();
            } catch (err) {
                alert('❌ Fichier invalide: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportFullReport() {
    const fullName = ((profile.prenom || '') + ' ' + (profile.nom || '')).trim() || 'Étudiant';
    const totalWords = productions.reduce((sum, p) => sum + (p.words || 0), 0);
    
    let report = `RAPPORT TCF EE STUDIO X\n`;
    report += `========================\n\n`;
    report += `Étudiant : ${fullName}\n`;
    report += `Date : ${new Date().toLocaleString('fr-FR')}\n\n`;
    report += `📊 STATISTIQUES GLOBALES\n`;
    report += `Productions : ${productions.length}\n`;
    report += `Mots rédigés : ${totalWords}\n`;
    report += `Moyenne par production : ${productions.length ? Math.round(totalWords / productions.length) : 0} mots\n`;
    report += `Vocabulaire : ${vocabList.length} mots\n`;
    report += `Erreurs suivies : ${myErrors.length}\n`;
    report += `Série actuelle : ${streak.cur} jours\n\n`;
    
    report += `📝 DERNIÈRES PRODUCTIONS\n`;
    productions.slice(0, 10).forEach((p, i) => {
        report += `${i+1}. ${p.date} — ${p.topic} — ${p.words} mots — ${p.confidence || '?'}\n`;
        report += `   ${p.text.substring(0, 100)}${p.text.length > 100 ? '...' : ''}\n\n`;
    });
    
    dl(new Blob([report], { type: 'text/plain' }), `TCF_rapport_${todayStr()}.txt`);
}
