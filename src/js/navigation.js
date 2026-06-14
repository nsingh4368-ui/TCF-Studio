
export function setActiveNavigation(page){
 document.querySelectorAll('.sidebar a').forEach(a=>{
   a.classList.toggle('active', a.dataset.page===page);
 });
}
