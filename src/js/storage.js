export const storage={
save:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),
load:(k)=>JSON.parse(localStorage.getItem(k))
};