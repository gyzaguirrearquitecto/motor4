import { fetchJSON, escapeHTML, toPrettyJSON, downloadJSON } from "./utils.js";
import { evaluate } from "./engine.js";
import { loadState, saveState, loadChecklistProgress, saveChecklistProgress } from "./storage.js";
import { resolveChecklistModules, buildChecklist, computeProgress } from "./checklist.js";

const STATE_DEFAULT={scope:"edificacion",es_patrimonio_cultural:false,regimen_propiedad_exclusiva_y_comun:false};
const el=id=>document.getElementById(id);
const show=(id,yes)=>{const n=el(id); if(n) n.style.display=yes?"block":"none";};

let RULESET=null, CHECKLISTS=null;
let checked = loadChecklistProgress();

function gather(){
  const scope=el("scope").value;
  const base={
    scope,
    es_patrimonio_cultural:el("es_patrimonio_cultural").checked,
    regimen_propiedad_exclusiva_y_comun:el("regimen_propiedad_exclusiva_y_comun").checked,
    es_programa_bfh_reubicacion:el("es_programa_bfh_reubicacion").checked,
    es_proyecto_inversion_publica_app_concesion_servicios_publicos:el("es_proyecto_inversion_publica_app_concesion_servicios_publicos").checked
  };
  if(scope==="edificacion"){
    return {...base,
      tipo_intervencion:el("tipo_intervencion").value||null,
      uso_principal:el("uso_principal").value||null,
      pisos:el("pisos").value?Number(el("pisos").value):null,
      area_techada_m2:el("area_techada_m2").value?Number(el("area_techada_m2").value):null,
      area_total_resultante_m2:el("area_total_resultante_m2").value?Number(el("area_total_resultante_m2").value):null,
      incluye_sotano_o_semisotano:el("incluye_sotano_o_semisotano").checked,
      profundidad_excavacion_m:el("profundidad_excavacion_m").value?Number(el("profundidad_excavacion_m").value):null,
      colinda_con_edificacion_existente:el("colinda_con_edificacion_existente").checked,
      usa_explosivos:el("usa_explosivos").checked,
      aumento_area_techada:el("aumento_area_techada").checked,
      modificacion_estructural:el("modificacion_estructural").checked,
      cambio_uso:el("cambio_uso").checked,
      longitud_cerco_m:el("longitud_cerco_m").value?Number(el("longitud_cerco_m").value):null,
      ocupantes:el("ocupantes").value?Number(el("ocupantes").value):null
    };
  }
  return {...base,
    uso_predial:el("uso_predial").value||null,
    area_predial_ha:el("area_predial_ha").value?Number(el("area_predial_ha").value):null,
    es_isla_rustica:el("es_isla_rustica").checked,
    conforma_lote_unico:el("conforma_lote_unico").checked,
    afecto_plan_vial_provincial_metropolitano:el("afecto_plan_vial_provincial_metropolitano").checked,
    por_etapas_proyecto_integral:el("por_etapas_proyecto_integral").checked,
    construccion_simultanea:el("construccion_simultanea").checked,
    solicita_venta_garantizada_lotes:el("solicita_venta_garantizada_lotes").checked,
    vende_viviendas_edificadas:el("vende_viviendas_edificadas").checked,
    requiere_planeamiento_integral:el("requiere_planeamiento_integral").checked,
    colinda_con_zona_arqueologica_patrimonio_anp:el("colinda_con_zona_arqueologica_patrimonio_anp").checked,
    es_area_natural_protegida_o_zona_amortiguamiento_o_ecosistema_fragil:el("es_area_natural_protegida_o_zona_amortiguamiento_o_ecosistema_fragil").checked,
    tipo_intervencion:el("hu_tipo_intervencion").value||null
  };
}

function outcomeClass(res){
  if(res.outcome_type==="exento") return "out-exento";
  if(res.outcome_type==="indeterminado") return "out-indet";
  if(res.outcome_type==="modalidad"){
    if(res.modalidad==="A") return "out-a";
    if(res.modalidad==="B") return "out-b";
    if(res.modalidad==="C") return "out-c";
    if(res.modalidad==="D") return "out-d";
  }
  return "out-indet";
}
function badgeText(res){
  if(res.outcome_type==="modalidad") return `Modalidad ${res.modalidad}`;
  if(res.outcome_type==="exento") return "Exento";
  return "Indeterminado";
}

function renderChecklist(input,res){
  const host=el("checklist");
  host.innerHTML = "";
  const modules = resolveChecklistModules(CHECKLISTS, res);
  const checklist = buildChecklist(CHECKLISTS, modules, input);
  const prog = computeProgress(checklist, checked);

  el("ck_summary").innerHTML = `
    <div class="ckpill">Completado: <strong>${prog.pct}%</strong> (${prog.done}/${prog.total})</div>
    <div class="ckpill">Obligatorios: <strong>${prog.reqPct}%</strong> (${prog.reqDone}/${prog.required})</div>
  `;

  if(!checklist.length){
    host.innerHTML = `<div class="muted">No hay checklist asociado a este resultado.</div>`;
    return;
  }

  for(const mod of checklist){
    const sec = document.createElement("section");
    sec.className = "ckmod";
    sec.innerHTML = `<h3>${escapeHTML(mod.title)}</h3>`;
    for(const g of mod.groups){
      const gEl = document.createElement("div");
      gEl.className = "ckgroup";
      gEl.innerHTML = `<div class="ckgtitle">${escapeHTML(g.title)}</div>`;
      const ul = document.createElement("ul");
      ul.className = "cklist";
      for(const it of g.items){
        const k = it._key;
        const isChecked = !!checked[k];
        const li = document.createElement("li");
        li.className = "ckitem" + (it.required ? " req" : "") + (isChecked ? " done" : "");
        li.innerHTML = `
          <label class="ckrow">
            <input type="checkbox" data-key="${escapeHTML(k)}" ${isChecked ? "checked":""}/>
            <span class="cktext">${escapeHTML(it.text)}</span>
            ${it.required ? `<span class="tag">OBLIG.</span>` : `<span class="tag ghost">OPC.</span>`}
          </label>`;
        ul.appendChild(li);
      }
      gEl.appendChild(ul);
      sec.appendChild(gEl);
    }
    host.appendChild(sec);
  }

  host.querySelectorAll("input[type=checkbox][data-key]").forEach(cb=>{
    cb.addEventListener("change", ()=>{
      const k = cb.getAttribute("data-key");
      checked[k] = cb.checked;
      saveChecklistProgress(checked);
      renderChecklist(input, res);
    });
  });
}

function renderResult(input,res){
  const out=el("resultado");
  const cls=outcomeClass(res);
  const proc=res.procedimiento?`<div class="muted">${escapeHTML(res.procedimiento)}</div>`:"";
  const label=res.label?`<div><strong>${escapeHTML(res.label)}</strong></div>`:"";
  const rutas=Array.isArray(res.ruta)?res.ruta:[];
  const chk=Array.isArray(res.checklist_refs)?res.checklist_refs:[];
  const al=Array.isArray(res.alertas)?res.alertas:[];
  const fuente=res.fuente?`
    <details class="src"><summary>Fuente normativa</summary>
      <div class="muted">${escapeHTML(res.fuente.norma||"")} — Art. ${escapeHTML(res.fuente.articulo||"")} ${res.fuente.literal?("lit. "+escapeHTML(res.fuente.literal)):""}</div>
      ${res.fuente.url?`<div class="muted"><a href="${escapeHTML(res.fuente.url)}" target="_blank" rel="noopener">Ver documento</a></div>`:""}
    </details>`:"";

  out.innerHTML=`
    <div class="card ${cls}">
      <div class="topline">
        <div class="badge">${escapeHTML(badgeText(res))}</div>
        <div class="actions"><button id="btn_export">Exportar JSON</button></div>
      </div>
      ${label}${proc}
      ${res.rule_name?`<div class="muted">Regla aplicada: ${escapeHTML(res.rule_name)} (${escapeHTML(res.rule_id||"")})</div>`:""}
      ${fuente}
      <hr/>
      <div class="grid2">
        <div><h3>Ruta</h3><ul>${rutas.map(r=>`<li>${escapeHTML(r)}</li>`).join("")||"<li class='muted'>—</li>"}</ul></div>
        <div><h3>Refs checklist (motor)</h3><ul>${chk.map(c=>`<li><code>${escapeHTML(c)}</code></li>`).join("")||"<li class='muted'>—</li>"}</ul></div>
      </div>
      <h3>Alertas</h3><ul>${al.map(a=>`<li>${escapeHTML(a)}</li>`).join("")||"<li class='muted'>—</li>"}</ul>
    </div>`;
  el("btn_export").onclick = ()=>{
    downloadJSON("ley29090_resultado.json", {input, result: res, exported_at: new Date().toISOString()});
  };
  renderChecklist(input,res);
}

async function loadCases(){
  const cases=await fetchJSON("./data/casos_prueba.json");
  const s=el("casos");
  s.innerHTML=`<option value="">(elige un caso de prueba)</option>`+cases.cases.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.id)} — ${escapeHTML(c.title)}</option>`).join("");
  s.onchange=()=>{
    const id=s.value; if(!id) return;
    const c=cases.cases.find(x=>x.id===id); if(!c) return;
    apply(c.input);
  };
}

function apply(st){
  el("scope").value=st.scope||"edificacion";
  el("es_patrimonio_cultural").checked=!!st.es_patrimonio_cultural;
  el("regimen_propiedad_exclusiva_y_comun").checked=!!st.regimen_propiedad_exclusiva_y_comun;
  el("es_programa_bfh_reubicacion").checked=!!st.es_programa_bfh_reubicacion;
  el("es_proyecto_inversion_publica_app_concesion_servicios_publicos").checked=!!st.es_proyecto_inversion_publica_app_concesion_servicios_publicos;

  show("grupo_edif", el("scope").value==="edificacion");
  show("grupo_hu", el("scope").value==="habilitacion_urbana");

  if(el("scope").value==="edificacion"){
    el("tipo_intervencion").value=st.tipo_intervencion||"";
    el("uso_principal").value=st.uso_principal||"";
    el("pisos").value=(st.pisos??"");
    el("area_techada_m2").value=(st.area_techada_m2??"");
    el("area_total_resultante_m2").value=(st.area_total_resultante_m2??"");
    el("incluye_sotano_o_semisotano").checked=!!st.incluye_sotano_o_semisotano;
    el("profundidad_excavacion_m").value=(st.profundidad_excavacion_m??"");
    el("colinda_con_edificacion_existente").checked=!!st.colinda_con_edificacion_existente;
    el("usa_explosivos").checked=!!st.usa_explosivos;
    el("aumento_area_techada").checked=!!st.aumento_area_techada;
    el("modificacion_estructural").checked=!!st.modificacion_estructural;
    el("cambio_uso").checked=!!st.cambio_uso;
    el("longitud_cerco_m").value=(st.longitud_cerco_m??"");
    el("ocupantes").value=(st.ocupantes??"");
  } else {
    el("uso_predial").value=st.uso_predial||"";
    el("area_predial_ha").value=(st.area_predial_ha??"");
    el("es_isla_rustica").checked=!!st.es_isla_rustica;
    el("conforma_lote_unico").checked=!!st.conforma_lote_unico;
    el("afecto_plan_vial_provincial_metropolitano").checked=!!st.afecto_plan_vial_provincial_metropolitano;
    el("por_etapas_proyecto_integral").checked=!!st.por_etapas_proyecto_integral;
    el("construccion_simultanea").checked=!!st.construccion_simultanea;
    el("solicita_venta_garantizada_lotes").checked=!!st.solicita_venta_garantizada_lotes;
    el("vende_viviendas_edificadas").checked=!!st.vende_viviendas_edificadas;
    el("requiere_planeamiento_integral").checked=!!st.requiere_planeamiento_integral;
    el("colinda_con_zona_arqueologica_patrimonio_anp").checked=!!st.colinda_con_zona_arqueologica_patrimonio_anp;
    el("es_area_natural_protegida_o_zona_amortiguamiento_o_ecosistema_fragil").checked=!!st.es_area_natural_protegida_o_zona_amortiguamiento_o_ecosistema_fragil;
    el("hu_tipo_intervencion").value=st.tipo_intervencion||"";
  }
  run();
}

function run(){
  const input=gather();
  saveState(input);
  el("input_dump").textContent=toPrettyJSON(input);
  const res = evaluate(RULESET,input);
  renderResult(input,res);
}

export async function init(){
  RULESET=await fetchJSON("./data/reglas_29090.json");
  CHECKLISTS=await fetchJSON("./data/checklists_29090.json");
  document.querySelectorAll("input,select").forEach(n=>{n.addEventListener("change",run);n.addEventListener("keyup",run);});
  el("scope").onchange=()=>{show("grupo_edif",el("scope").value==="edificacion");show("grupo_hu",el("scope").value==="habilitacion_urbana");run();};
  await loadCases();
  apply(loadState()||STATE_DEFAULT);
}
