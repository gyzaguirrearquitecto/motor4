import { evalCondition } from "./engine.js";
function keyFor(item){ return item.id; }
export function resolveChecklistModules(checklists, evaluation){
  const refs = Array.isArray(evaluation.checklist_refs) ? evaluation.checklist_refs : [];
  const map = (checklists.resolution && checklists.resolution.ref_map) ? checklists.resolution.ref_map : {};
  const ids = [];
  for(const r of refs){
    const id = map[r] || r;
    if(id && !ids.includes(id)) ids.push(id);
  }
  if(ids.length===0 && evaluation.outcome_type==="modalidad"){
    if(evaluation.scope==="habilitacion_urbana"){ ids.push(`HU-${evaluation.modalidad}-BASE`); }
    else { ids.push(`${evaluation.modalidad}-EDIF-BASE`); }
  }
  return ids;
}
export function buildChecklist(checklists, modules, input){
  const byId = new Map(checklists.modules.map(m=>[m.id,m]));
  const out = [];
  for(const id of modules){
    const mod = byId.get(id);
    if(!mod) continue;
    const groups = [];
    for(const g of (mod.groups||[])){
      const items = [];
      for(const it of (g.items||[])){
        const ok = it.when ? evalCondition(it.when, input) : true;
        if(ok){ items.push({...it, _key: keyFor(it), _module:id, _group:g.id}); }
      }
      if(items.length) groups.push({...g, items});
    }
    if(groups.length) out.push({id:mod.id, title:mod.title, tags:mod.tags||[], groups});
  }
  return out;
}
export function computeProgress(checklist, checked){
  let total=0, done=0, required=0, reqDone=0;
  for(const mod of checklist){
    for(const g of mod.groups){
      for(const it of g.items){
        total += 1; if(checked[it._key]) done += 1;
        if(it.required){ required += 1; if(checked[it._key]) reqDone += 1; }
      }
    }
  }
  return {total, done, required, reqDone, pct: total?Math.round(done*100/total):0, reqPct: required?Math.round(reqDone*100/required):0};
}
