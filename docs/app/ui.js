import { fetchJSON, downloadText, downloadJSON, escapeHTML } from "./utils.js";
import { parseMotorExport, classifyKey } from "./parser.js";
import { buildExpedienteModel, renderExpedienteHTML } from "./expediente.js";

const el = (id)=>document.getElementById(id);

let PLANTILLAS=null;
let motorPayload=null;
let currentModel=null;

function val(id){ return (el(id)?.value||"").trim(); }

function readMeta(){
  return {
    codigo_expediente: val("codigo_expediente"),
    municipalidad: val("municipalidad"),
    fecha: val("fecha"),
    administrado: val("administrado"),
    doc_id: val("doc_id"),
    ubicacion: val("ubicacion"),
    profesional: val("profesional"),
    colegiatura: val("colegiatura"),
    contacto: val("contacto"),
    anexos: collectAnexos()
  };
}

function collectAnexos(){
  const rows = [...document.querySelectorAll("[data-anexo-row]")];
  return rows.map(r=>({
    code: r.querySelector("[data-a=code]")?.value||"",
    name: r.querySelector("[data-a=name]")?.value||"",
    qty: r.querySelector("[data-a=qty]")?.value||"",
    note: r.querySelector("[data-a=note]")?.value||""
  })).filter(x=>x.code||x.name||x.qty||x.note);
}

function addAnexoRow(pref={}){
  const host = el("anexos");
  const d = document.createElement("div");
  d.className = "arow";
  d.setAttribute("data-anexo-row","");
  d.innerHTML = `
    <input placeholder="Código" data-a="code" value="${escapeHTML(pref.code||"")}"/>
    <input placeholder="Documento" data-a="name" value="${escapeHTML(pref.name||"")}"/>
    <input placeholder="Cant." data-a="qty" value="${escapeHTML(pref.qty||"")}"/>
    <input placeholder="Nota" data-a="note" value="${escapeHTML(pref.note||"")}"/>
    <button class="ghost" type="button" title="Quitar">×</button>
  `;
  d.querySelector("button").onclick = ()=>{ d.remove(); refresh(); };
  host.appendChild(d);
}

function plantillaFor(modKey){
  if(!PLANTILLAS) return null;
  if(modKey==="HU") return PLANTILLAS.by_modalidad.HU;
  if(modKey==="EXENTO") return { title:"Expediente — Exento", sections:[{id:"S01",title:"Portada"},{id:"S02",title:"Ficha de datos"},{id:"S03",title:"Determinación"}], doc_buckets:[] };
  if(modKey==="INDET") return { title:"Expediente — Indeterminado", sections:[{id:"S01",title:"Portada"},{id:"S02",title:"Ficha de datos"},{id:"S03",title:"Determinación"}], doc_buckets:[] };
  return PLANTILLAS.by_modalidad[modKey] || PLANTILLAS.by_modalidad.B;
}

function refresh(){
  if(!motorPayload){
    el("preview").srcdoc = `<div style="font-family:system-ui;padding:18px;color:#556">Importa el JSON exportado por el motor (ley29090_resultado.json) o carga el ejemplo.</div>`;
    el("status").textContent = "Sin motor importado.";
    return;
  }
  const meta = readMeta();
  const modKey = classifyKey(motorPayload.input, motorPayload.result);
  const plantilla = plantillaFor(modKey);
  currentModel = buildExpedienteModel({motor:motorPayload, meta, plantilla});
  const html = renderExpedienteHTML(currentModel);
  el("preview").srcdoc = html;
  el("status").textContent = `OK — ${currentModel.clasificacion}`;
}

async function loadExample(){
  const raw = await fetchJSON("./data/sample_ley29090_resultado.json");
  motorPayload = parseMotorExport(raw);
  refresh();
}

async function handleFile(file){
  const text = await file.text();
  const raw = JSON.parse(text);
  motorPayload = parseMotorExport(raw);
  refresh();
}

function exportHTML(){
  if(!currentModel) return;
  const html = renderExpedienteHTML(currentModel);
  const safe = (readMeta().codigo_expediente || "expediente_29090").replaceAll(" ","_");
  downloadText(`${safe}.html`, html, "text/html");
}
function exportJSON(){
  if(!currentModel) return;
  const safe = (readMeta().codigo_expediente || "expediente_29090").replaceAll(" ","_");
  downloadJSON(`${safe}.json`, currentModel);
}
function printPDF(){
  // Imprime el contenido del iframe (preview). El usuario guarda como PDF en el diálogo.
  const frame = el("preview");
  frame.contentWindow.focus();
  frame.contentWindow.print();
}

export async function init(){
  PLANTILLAS = await fetchJSON("./data/plantillas_expediente.json");

  el("btn_example").onclick = loadExample;
  el("file_motor").addEventListener("change", (e)=>{
    const f = e.target.files?.[0];
    if(f) handleFile(f).catch(err=>alert(err.message));
  });

  el("btn_add_anexo").onclick = ()=>{ addAnexoRow({}); };

  ["codigo_expediente","municipalidad","fecha","administrado","doc_id","ubicacion","profesional","colegiatura","contacto"].forEach(id=>{
    el(id).addEventListener("input", refresh);
  });

  el("btn_export_html").onclick = exportHTML;
  el("btn_export_json").onclick = exportJSON;
  el("btn_print_pdf").onclick = printPDF;

  // Start with one empty row
  addAnexoRow({});
  refresh();
}
