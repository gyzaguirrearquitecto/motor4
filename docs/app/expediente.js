import { escapeHTML } from "./utils.js";

export function buildExpedienteModel({motor, meta, plantilla}){
  const {input, result} = motor;

  const modalidad = (result.outcome_type==="modalidad" ? (result.modalidad||"") : "");
  const scope = input.scope || "edificacion";
  const clasificacion = scope==="habilitacion_urbana" ? `HU ${modalidad||""}`.trim() :
    (result.outcome_type==="modalidad" ? `Modalidad ${modalidad}` :
     (result.outcome_type==="exento" ? "Exento" : "Indeterminado"));

  const ruta = Array.isArray(result.ruta) ? result.ruta : [];
  const alertas = Array.isArray(result.alertas) ? result.alertas : [];

  const buckets = plantilla?.doc_buckets || [];
  // User-provided attachments override / enrich
  const anexos = (meta.anexos||[]).map(a=>({
    code: a.code||"",
    name: a.name||"",
    qty: a.qty||"",
    note: a.note||""
  }));

  return {
    generated_at: new Date().toISOString(),
    meta,
    motor: {input, result},
    clasificacion,
    ruta,
    alertas,
    plantilla: {
      title: plantilla?.title || "Expediente",
      sections: plantilla?.sections || [],
      doc_buckets: buckets
    },
    anexos
  };
}

function row(k,v){
  return `<tr><td class="k">${escapeHTML(k)}</td><td class="v">${escapeHTML(v||"")}</td></tr>`;
}

export function renderExpedienteHTML(model){
  const m = model.meta || {};
  const motor = model.motor || {};
  const input = motor.input || {};
  const result = motor.result || {};

  const cover = `
    <section class="page cover">
      <div class="brand">EXP-29090</div>
      <h1>${escapeHTML(model.plantilla.title || "Expediente")}</h1>
      <h2>${escapeHTML(model.clasificacion)}</h2>
      <div class="coverGrid">
        <div class="box">
          <div class="boxt">Administrado</div>
          <div class="boxv">${escapeHTML(m.administrado||"")}</div>
        </div>
        <div class="box">
          <div class="boxt">Municipalidad</div>
          <div class="boxv">${escapeHTML(m.municipalidad||"")}</div>
        </div>
        <div class="box">
          <div class="boxt">Predio / Ubicación</div>
          <div class="boxv">${escapeHTML(m.ubicacion||"")}</div>
        </div>
        <div class="box">
          <div class="boxt">Fecha</div>
          <div class="boxv">${escapeHTML(m.fecha||"")}</div>
        </div>
      </div>
      <div class="small muted">Generado: ${escapeHTML(new Date(model.generated_at).toLocaleString())}</div>
    </section>
  `;

  const ficha = `
    <section class="page">
      <h3>1. Ficha de datos</h3>
      <table class="tbl">
        ${row("Expediente / Código", m.codigo_expediente || "")}
        ${row("Administrado", m.administrado || "")}
        ${row("DNI/RUC", m.doc_id || "")}
        ${row("Municipalidad", m.municipalidad || "")}
        ${row("Ubicación", m.ubicacion || "")}
        ${row("Profesional responsable", m.profesional || "")}
        ${row("Colegiatura", m.colegiatura || "")}
        ${row("Correo / Teléfono", m.contacto || "")}
      </table>

      <h4>Datos del proyecto (según motor)</h4>
      <pre class="pre">${escapeHTML(JSON.stringify(input, null, 2))}</pre>
    </section>
  `;

  const det = `
    <section class="page">
      <h3>2. Determinación (Motor)</h3>
      <div class="pill">${escapeHTML(model.clasificacion)}</div>
      ${result.procedimiento ? `<div class="muted">${escapeHTML(result.procedimiento)}</div>` : ""}

      <h4>Ruta</h4>
      <ul>
        ${(model.ruta||[]).map(x=>`<li>${escapeHTML(x)}</li>`).join("") || `<li class="muted">—</li>`}
      </ul>

      <h4>Alertas</h4>
      <ul>
        ${(model.alertas||[]).map(x=>`<li>${escapeHTML(x)}</li>`).join("") || `<li class="muted">—</li>`}
      </ul>

      <details class="src">
        <summary>Trazabilidad (regla aplicada)</summary>
        <div class="muted">rule_id: <code>${escapeHTML(result.rule_id||"")}</code></div>
        <div class="muted">rule_name: ${escapeHTML(result.rule_name||"")}</div>
      </details>
    </section>
  `;

  const buckets = (model.plantilla.doc_buckets||[]).map(b=>{
    const rows = (b.items||[]).map(it=>{
      const min = (it.qty_min ?? "");
      const max = (it.qty_max ?? "");
      const rango = (min==="" && max==="") ? "" : `${min}–${max}`;
      return `<tr>
        <td><code>${escapeHTML(it.code||"")}</code></td>
        <td>${escapeHTML(it.name||"")}</td>
        <td class="c">${escapeHTML(rango)}</td>
        <td class="c"><span class="muted">Pendiente</span></td>
      </tr>`;
    }).join("");
    return `<div class="bucket">
      <div class="buckett">${escapeHTML(b.title||"")}</div>
      <table class="tbl slim">
        <tr><th>Código</th><th>Documento</th><th class="c">Rango (min–max)</th><th class="c">Estado</th></tr>
        ${rows}
      </table>
    </div>`;
  }).join("");

  const anexosUser = (model.anexos||[]).length ? `
    <h4>Anexos adicionales (usuario)</h4>
    <table class="tbl slim">
      <tr><th>Código</th><th>Documento</th><th class="c">Cantidad</th><th>Nota</th></tr>
      ${(model.anexos||[]).map(a=>`<tr>
        <td><code>${escapeHTML(a.code||"")}</code></td>
        <td>${escapeHTML(a.name||"")}</td>
        <td class="c">${escapeHTML(a.qty||"")}</td>
        <td>${escapeHTML(a.note||"")}</td>
      </tr>`).join("")}
    </table>` : `<div class="muted">No se registraron anexos adicionales.</div>`;

  const rel = `
    <section class="page">
      <h3>3. Relación de documentos (plantilla)</h3>
      <div class="muted">Este cuadro es la base. Se ampliará con el detalle normativo y TUPA por municipalidad.</div>
      ${buckets || `<div class="muted">—</div>`}
      <hr/>
      ${anexosUser}
    </section>
  `;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHTML(model.plantilla.title || "Expediente")}</title>
<style>
:root{--b:#111;--m:#556;--bd:#e6e8ee;--bg:#f6f7f9;}
*{box-sizing:border-box}
body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0;color:var(--b);background:#fff;}
.page{padding:26px 34px;page-break-after:always;}
.cover{background:linear-gradient(180deg,#0f172a 0,#111827 65%, #0b1020 100%);color:#fff;}
.brand{font-weight:900;letter-spacing:.08em}
h1{margin:10px 0 0 0;font-size:26px}
h2{margin:8px 0 18px 0;font-size:16px;opacity:.95}
h3{margin:0 0 10px 0}
h4{margin:16px 0 8px 0}
.small{font-size:12px}
.muted{color:var(--m);font-size:12px}
.coverGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.box{border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px;background:rgba(255,255,255,.06)}
.boxt{font-size:12px;opacity:.9}
.boxv{font-size:14px;font-weight:700;margin-top:4px}
.tbl{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--bd);border-radius:12px;overflow:hidden}
.tbl td,.tbl th{padding:10px 12px;border-bottom:1px solid var(--bd);vertical-align:top}
.tbl tr:last-child td{border-bottom:none}
.tbl th{background:#f3f5f9;font-size:12px;text-align:left}
.tbl .k{width:220px;background:#fbfcfe;font-weight:700}
.tbl .c{text-align:center;white-space:nowrap}
.tbl.slim td,.tbl.slim th{padding:8px 10px}
.pre{background:#0b1020;color:#e7ebff;padding:12px;border-radius:12px;overflow:auto;font-size:12px}
.pill{display:inline-block;border:1px solid var(--bd);border-radius:999px;padding:6px 10px;font-weight:800;font-size:12px;background:#f1f5ff}
.bucket{margin:14px 0}
.buckett{font-weight:900;font-size:12px;letter-spacing:.04em;text-transform:uppercase;margin:8px 0}
hr{border:none;border-top:1px solid #eee;margin:14px 0}
details.src{margin-top:10px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;background:#f3f5f9;border:1px solid var(--bd);padding:2px 6px;border-radius:10px}
@media print{
  body{background:#fff}
  .page{page-break-after:always}
}
</style>
</head>
<body>
${cover}
${ficha}
${det}
${rel}
</body>
</html>`;
}
