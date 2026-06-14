
export function countWords(text=''){
 return text.trim() ? text.trim().split(/\s+/).length : 0;
}
