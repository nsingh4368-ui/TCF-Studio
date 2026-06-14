export function autosave(content){
 localStorage.setItem('writingDraft', content);
}
export function loadDraft(){
 return localStorage.getItem('writingDraft') || '';
}