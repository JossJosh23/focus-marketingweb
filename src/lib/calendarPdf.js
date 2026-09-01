const GREEN = [7, 105, 59];
const ORANGE = [239, 132, 31];
const INK = [27, 42, 34];
const MUTED = [105, 119, 111];
const PAPER = [247, 249, 247];

function text(doc, value, x, y, options = {}) {
  doc.setFont("helvetica", options.bold ? "bold" : "normal");
  doc.setFontSize(options.size || 10);
  doc.setTextColor(...(options.color || INK));
  const lines = doc.splitTextToSize(String(value || "—"), options.width || 100);
  doc.text(lines, x, y, { align: options.align || "left" });
  return lines.length;
}

function label(doc, value, x, y) {
  text(doc, value.toUpperCase(), x, y, { bold: true, size: 7, color: MUTED, width: 55 });
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(.7);
  doc.line(x, y + 2, x + 15, y + 2);
}

function pageHeader(doc, company, periodLabel) {
  text(doc, "CRONOGRAMA", 14, 17, { bold: true, size: 18 });
  text(doc, "de contenido", 14, 24, { size: 12, color: GREEN });
  doc.setFillColor(...GREEN);
  doc.rect(54, 10, 1, 17, "F");
  text(doc, periodLabel.toUpperCase(), 62, 16, { bold: true, size: 9, color: GREEN });
  text(doc, "Planificación de redes sociales", 62, 22, { size: 7, color: MUTED });
  text(doc, company, 282, 17, { bold: true, size: 14, color: GREEN, align: "right", width: 75 });
}

function pageFooter(doc, period, page) {
  doc.setDrawColor(...GREEN);
  doc.line(14, 196, 283, 196);
  text(doc, "PLANIFICAMOS HOY PARA CONECTAR MAÑANA", 16, 201, { bold: true, size: 6, color: GREEN });
  text(doc, `${period} · ${String(page).padStart(2, "0")}`, 281, 201, { bold: true, size: 6, color: GREEN, align: "right" });
}

function statusLabel(item) {
  if (item.approvalStatus === "approved") return "APROBADO";
  if (item.approvalStatus === "changes_requested") return "CAMBIOS SOLICITADOS";
  return "PENDIENTE";
}

export async function createCalendarPdf({ company, period, plan, publications }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const date = new Date(`${period}-01T12:00:00`);
  const periodLabel = date.toLocaleDateString("es-EC", { month: "long", year: "numeric" });

  doc.setFillColor(...PAPER);
  doc.rect(0, 0, 297, 210, "F");
  pageHeader(doc, company, periodLabel);
  doc.setFillColor(...ORANGE);
  doc.roundedRect(14, 42, 269, 38, 4, 4, "F");
  text(doc, company, 24, 59, { bold: true, size: 25, color: [255, 255, 255], width: 180 });
  text(doc, periodLabel, 24, 69, { size: 12, color: [255, 245, 235] });
  const metrics = [
    ["PUBLICACIONES", publications.length],
    ["POSTS POR SEMANA", plan?.posts_per_week ?? plan?.postsPerWeek ?? 0],
    ["VIDEOS DEL MES", plan?.videos_per_month ?? plan?.videosPerMonth ?? 0],
  ];
  metrics.forEach(([name, value], index) => {
    const x = 14 + index * 91;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(218, 227, 221);
    doc.roundedRect(x, 91, 86, 36, 3, 3, "FD");
    text(doc, name, x + 7, 101, { bold: true, size: 7, color: MUTED });
    text(doc, value, x + 7, 118, { bold: true, size: 20, color: GREEN });
  });
  label(doc, "Resumen de estrategia", 16, 145);
  text(doc, plan?.strategy_summary ?? plan?.strategySummary ?? "Sin estrategia mensual registrada.", 16, 157, { size: 11, width: 260 });
  pageFooter(doc, period, 1);

  publications.forEach((item, index) => {
    doc.addPage("a4", "landscape");
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, 297, 210, "F");
    pageHeader(doc, company, periodLabel);
    doc.setFillColor(...GREEN);
    doc.roundedRect(14, 38, 71, 146, 3, 3, "F");
    text(doc, "PLATAFORMAS Y DATOS", 49.5, 49, { bold: true, size: 8, color: [255, 255, 255], align: "center", width: 62 });
    doc.setFillColor(242, 247, 244);
    doc.roundedRect(17, 56, 65, 124, 2, 2, "F");
    text(doc, (item.platforms || []).join(" • ") || "Sin plataformas", 49.5, 67, { bold: true, size: 8, color: GREEN, align: "center", width: 55 });
    const facts = [
      ["FECHA TENTATIVA", new Date(`${item.date}T12:00:00`).toLocaleDateString("es-EC")],
      ["FORMATO", `${item.format || "—"} · ${item.distributionType === "paid" ? "PAUTA" : "ORGÁNICO"}`],
      ["ESTADO", statusLabel(item)],
      ["PRODUCCIÓN / REFERENCIA", item.productionReference || "Sin referencia agregada"],
    ];
    let factY = 83;
    facts.forEach(([name, value]) => {
      text(doc, name, 22, factY, { bold: true, size: 6.5, color: MUTED, width: 54 });
      const count = text(doc, value, 22, factY + 7, { bold: true, size: 8, color: name === "ESTADO" ? ORANGE : INK, width: 54 });
      factY += Math.max(22, 11 + count * 4);
    });
    doc.setDrawColor(...GREEN);
    doc.roundedRect(91, 38, 192, 146, 3, 3, "S");
    doc.setFillColor(...ORANGE);
    doc.roundedRect(91, 38, 192, 16, 3, 3, "F");
    doc.rect(91, 48, 192, 6, "F");
    text(doc, item.topic || "Sin título", 187, 49, { bold: true, size: 13, color: [255, 255, 255], align: "center", width: 170 });
    label(doc, "Objetivo", 99, 67);
    text(doc, item.objective || "Sin objetivo agregado", 139, 67, { bold: true, size: 9, width: 132 });
    label(doc, "Texto de publicación", 99, 91);
    text(doc, item.copy || "Sin texto agregado", 139, 91, { size: 9, width: 132 });
    label(doc, "Referencia visual", 99, 132);
    doc.setFillColor(231, 240, 235);
    doc.setDrawColor(201, 217, 208);
    doc.roundedRect(139, 119, 132, 53, 3, 3, "FD");
    if (item.mediaUrl && item.mediaType === "image") {
      try { doc.addImage(item.mediaUrl, undefined, 142, 122, 126, 47, undefined, "FAST"); }
      catch { text(doc, item.productionReference || "Referencia visual adjunta", 205, 148, { bold: true, size: 9, color: GREEN, align: "center", width: 110 }); }
    } else {
      text(doc, item.mediaType === "video" ? "VIDEO ADJUNTO EN EL PORTAL" : item.productionReference || "IMAGEN / IDEA POR DEFINIR", 205, 148, { bold: true, size: 9, color: GREEN, align: "center", width: 110 });
    }
    pageFooter(doc, period, index + 2);
  });

  return doc;
}
