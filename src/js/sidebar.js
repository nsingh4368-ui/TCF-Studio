
export function createSidebar(active='dashboard'){
 const items=[
  'dashboard','reading','listening','writing',
  'progress','history','settings'
 ];
 return `
 <aside class="sidebar">
   <div class="logo">TCF Studio</div>
   <nav>
   ${items.map(i=>`
     <a href="#${i}" class="${active===i?'active':''}">${i}</a>
   `).join('')}
   </nav>
 </aside>`;
}
