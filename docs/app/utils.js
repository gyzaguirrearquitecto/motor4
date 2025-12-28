export async function fetchJSON(path){const r=await fetch(path,{cache:"no-store"});if(!r.ok) throw new Error(`No se pudo cargar ${path}: ${r.status}`);return await r.json();}
export function escapeHTML(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
export function toPrettyJSON(o){return JSON.stringify(o,null,2);}
export function downloadJSON(filename,obj){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}
