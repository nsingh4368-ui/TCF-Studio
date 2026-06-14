export function saveWritingSession(session){
 const history = JSON.parse(localStorage.getItem('writingHistory')||'[]');
 history.unshift(session);
 localStorage.setItem('writingHistory', JSON.stringify(history));
}