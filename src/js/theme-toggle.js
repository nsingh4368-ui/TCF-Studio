
export function toggleTheme(){
 const current=document.documentElement.dataset.theme||'dark';
 const next=current==='dark'?'light':'dark';
 document.documentElement.dataset.theme=next;
 localStorage.setItem('theme',next);
}
