export async function fetchJSON(path){
  const r = await fetch(path,{cache:"no-store"});
  if(!r.ok) throw new Error(`No se pudo cargar ${path}: ${r.status}`);
  return await r.json();
}
export function escapeHTML(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
export function downloadText(filename, text, mime="text/plain"){
  const blob = new Blob([text], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}
export function downloadJSON(filename, obj){
  downloadText(filename, JSON.stringify(obj, null, 2), "application/json");
}
