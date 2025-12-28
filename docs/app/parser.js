export function parseMotorExport(raw){
  // Espera: { input, result, exported_at } (como el JSON exportado por el motor)
  if(!raw || typeof raw!=="object") throw new Error("JSON inválido.");
  const input = raw.input || raw.payload?.input || null;
  const result = raw.result || raw.payload?.result || null;
  if(!input || !result) throw new Error("El JSON no contiene 'input' y 'result'.");
  return { input, result, exported_at: raw.exported_at || raw.exportedAt || null };
}
export function classifyKey(input, result){
  const scope = input.scope || result.scope || "edificacion";
  if(scope === "habilitacion_urbana") return "HU";
  if(result.outcome_type === "modalidad") return result.modalidad || "A";
  if(result.outcome_type === "exento") return "EXENTO";
  return "INDET";
}
