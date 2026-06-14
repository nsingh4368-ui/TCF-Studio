
export function createTopbar(title){
 return `
 <header class="topbar">
   <div>${title}</div>
   <button id="themeToggle">Theme</button>
 </header>`;
}
