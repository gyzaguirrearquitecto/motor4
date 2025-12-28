const KEY="ley29090_state_v4";
export function loadState(){try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):null;}catch{return null;}}
export function saveState(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
const CK="ley29090_check_v4";
export function loadChecklistProgress(){try{const r=localStorage.getItem(CK);return r?JSON.parse(r):{};}catch{return {};}}
export function saveChecklistProgress(p){try{localStorage.setItem(CK,JSON.stringify(p));}catch{}}
