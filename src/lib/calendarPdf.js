const GREEN = [7, 105, 59];
const ORANGE = [239, 132, 31];
const INK = [27, 42, 34];
const MUTED = [105, 119, 111];
const PAPER = [247, 249, 247];

function text(doc, value, x, y, options = {}) {
  doc.setFont("helvetica", options.bold ? "bold" : "normal");
  doc.setFontSize(options.size || 10);
  doc.setTextColor(...(options.color || INK));
  let lines = doc.splitTextToSize(String(value || "—"), options.width || 100);
  if (options.maxLines && lines.length > options.maxLines) {
    lines = lines.slice(0, options.maxLines);
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.…]+$/, "")}…`;
  }
  doc.text(lines, x, y, { align: options.align || "left" });
  return lines.length;
}

function label(doc, value, x, y) {
  text(doc, value.toUpperCase(), x, y, { bold: true, size: 7, color: MUTED, width: 55 });
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(.7);
  doc.line(x, y + 2, x + 15, y + 2);
}

function pageHeader(doc, company, periodLabel, logoData) {
  text(doc, "CRONOGRAMA", 14, 17, { bold: true, size: 15, width: 43, maxLines: 1 });
  text(doc, "de contenido", 14, 23, { size: 10, color: GREEN, width: 43, maxLines: 1 });
  doc.setFillColor(...GREEN);
  doc.rect(60, 10, 1, 17, "F");
  text(doc, periodLabel.toUpperCase(), 68, 16, { bold: true, size: 8.5, color: GREEN, width: 85, maxLines: 1 });
  text(doc, "Planificación de redes sociales", 68, 22, { size: 7, color: MUTED, width: 85, maxLines: 1 });
  if (logoData) {
    try { addContainedImage(doc, logoData, 242, 8, 40, 20); }
    catch { text(doc, company, 282, 17, { bold: true, size: company.length > 24 ? 10 : 13, color: GREEN, align: "right", width: 72, maxLines: 1 }); }
  } else text(doc, company, 282, 17, { bold: true, size: company.length > 24 ? 10 : 13, color: GREEN, align: "right", width: 72, maxLines: 1 });
}

function addContainedImage(doc, source, x, y, width, height) {
  const properties = doc.getImageProperties(source);
  const scale = Math.min(width / properties.width, height / properties.height);
  const imageWidth = properties.width * scale;
  const imageHeight = properties.height * scale;
  doc.addImage(source, properties.fileType, x + (width - imageWidth) / 2, y + (height - imageHeight) / 2, imageWidth, imageHeight, undefined, "FAST");
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

export async function createCalendarPdf({ company, logoData, period, plan, publications }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const date = new Date(`${period}-01T12:00:00`);
  const periodLabel = date.toLocaleDateString("es-EC", { month: "long", year: "numeric" });

  doc.setFillColor(...PAPER);
  doc.rect(0, 0, 297, 210, "F");
  pageHeader(doc, company, periodLabel, logoData);
  doc.setFillColor(...ORANGE);
  doc.roundedRect(14, 42, 269, 38, 4, 4, "F");
  if (logoData) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(23, 48, 67, 26, 3, 3, "F");
    try { addContainedImage(doc, logoData, 27, 51, 59, 20); }
    catch { text(doc, company, 24, 60, { bold: true, size: 22, color: [255, 255, 255], width: 75, maxLines: 1 }); }
    text(doc, periodLabel, 104, 64, { bold: true, size: 13, color: [255, 255, 255], width: 150, maxLines: 1 });
  } else {
    text(doc, company, 24, 59, { bold: true, size: 25, color: [255, 255, 255], width: 180, maxLines: 1 });
    text(doc, periodLabel, 24, 69, { size: 12, color: [255, 245, 235] });
  }
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
  text(doc, plan?.strategy_summary ?? plan?.strategySummary ?? "Sin estrategia mensual registrada.", 16, 157, { size: 10, width: 260, maxLines: 6 });
  pageFooter(doc, period, 1);

  doc.addPage("a4", "landscape");
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, 297, 210, "F");
  text(doc, "Una estructura clara con espacio para nuevas ideas", 18, 23, { bold: true, size: 17, width: 205, maxLines: 1 });
  text(doc, plan?.strategySummary || "Planificación mensual de contenidos.", 18, 33, { size: 8.5, color: MUTED, width: 205, maxLines: 2 });
  doc.setDrawColor(...ORANGE); doc.setLineWidth(1); doc.line(18, 39, 40, 39);
  if (logoData) { try { addContainedImage(doc, logoData, 244, 10, 37, 24); } catch { text(doc, company, 281, 22, { bold: true, size: 12, color: GREEN, align: "right", width: 55 }); } }
  else text(doc, company, 281, 22, { bold: true, size: 12, color: GREEN, align: "right", width: 55 });
  const rawMainLines = String(plan?.mainLines || "").trim();
  const legacyCount = rawMainLines.match(/^(\d+)\s+l[ií]neas?\s+principales?\s*[,.:;-]?\s*/i);
  const mainLinesCount = Number(plan?.mainLinesCount || legacyCount?.[1] || 0);
  const mainLinesDetail = legacyCount ? rawMainLines.slice(legacyCount[0].length).trim() : rawMainLines;
  const rows = [
    ["POSTS", `${plan?.postsPerWeek || 0} espacios por semana`, plan?.postsDetail || "Sin distribución definida"],
    ["VIDEOS", `${plan?.videosPerMonth || 0} durante ${date.toLocaleDateString("es-EC", { month: "long" })}`, plan?.videosDetail || "Sin tipos de video definidos"],
    ["PAUTA DE VIDEO", plan?.videoSchedule || "Sin fechas definidas", plan?.videoBoostDetail || "Sin frecuencia definida"],
    ["CONTENIDOS DEFINIDOS", `${mainLinesCount} líneas principales`, mainLinesDetail || "Sin líneas principales definidas"],
  ];
  rows.forEach(([title, value, detail], index) => {
    const y = 58 + index * 32;
    text(doc, title, 20, y, { bold: true, size: 7, color: ORANGE, width: 47, maxLines: 1 });
    text(doc, value, 73, y + 1, { bold: true, size: 12, color: GREEN, width: 88, maxLines: 2 });
    text(doc, detail, 166, y + 1, { size: 9, width: 105, maxLines: 3 });
    doc.setDrawColor(216, 225, 220); doc.setLineWidth(.25); doc.line(18, y + 17, 276, y + 17);
  });
  pageFooter(doc, period, 2);
  let nextPageNumber = 3;
  const keyDates = Array.isArray(plan?.keyDates) ? [...plan.keyDates].filter((item) => item.date && item.title).sort((a, b) => a.date.localeCompare(b.date)) : [];
  for (let start = 0; start < keyDates.length; start += 5) {
    const group = keyDates.slice(start, start + 5);
    doc.addPage("a4", "landscape");
    doc.setFillColor(...PAPER); doc.rect(0, 0, 297, 210, "F");
    text(doc, `${keyDates.length} ideas ya le dan dirección al mes`, 18, 23, { bold: true, size: 17, width: 205, maxLines: 1 });
    text(doc, "Las demás fechas se mantienen abiertas para completar la planificación.", 18, 33, { size: 8.5, color: MUTED, width: 205, maxLines: 1 });
    doc.setDrawColor(...ORANGE); doc.setLineWidth(1); doc.line(18, 39, 40, 39);
    if (logoData) { try { addContainedImage(doc, logoData, 244, 10, 37, 24); } catch { text(doc, company, 281, 22, { bold: true, size: 12, color: GREEN, align: "right", width: 55 }); } }
    else text(doc, company, 281, 22, { bold: true, size: 12, color: GREEN, align: "right", width: 55 });
    group.forEach((item, index) => {
      const y = 55 + index * 27;
      const dateLabel = new Date(`${item.date}T12:00:00`).toLocaleDateString("es-EC", { day: "2-digit", month: "short" }).toUpperCase().replace(".", "");
      text(doc, dateLabel, 20, y, { bold: true, size: 8, color: ORANGE, width: 28, maxLines: 1 });
      text(doc, item.title, 52, y, { bold: true, size: 12, color: GREEN, width: 85, maxLines: 2 });
      text(doc, item.description || "Contenido por desarrollar", 145, y, { size: 9, width: 125, maxLines: 3 });
      doc.setDrawColor(216, 225, 220); doc.setLineWidth(.25); doc.line(18, y + 13, 276, y + 13);
    });
    pageFooter(doc, period, nextPageNumber++);
  }

  publications.forEach((item, index) => {
    doc.addPage("a4", "landscape");
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, 297, 210, "F");
    pageHeader(doc, company, periodLabel, logoData);
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
      const count = text(doc, value, 22, factY + 7, { bold: true, size: 8, color: name === "ESTADO" ? ORANGE : INK, width: 54, maxLines: name === "PRODUCCIÓN / REFERENCIA" ? 5 : 2 });
      factY += Math.max(22, 11 + count * 4);
    });
    doc.setDrawColor(...GREEN);
    doc.roundedRect(91, 38, 192, 146, 3, 3, "S");
    doc.setFillColor(...ORANGE);
    doc.roundedRect(91, 38, 192, 16, 3, 3, "F");
    doc.rect(91, 48, 192, 6, "F");
    text(doc, item.topic || "Sin título", 187, 49, { bold: true, size: (item.topic || "").length > 55 ? 9 : 12, color: [255, 255, 255], align: "center", width: 165, maxLines: 1 });
    doc.setDrawColor(220, 228, 223);
    doc.setLineWidth(.25);
    doc.line(180, 54, 180, 184);
    doc.line(91, 91, 180, 91);
    label(doc, "Objetivo", 98, 66);
    text(doc, item.objective || "Sin objetivo agregado", 98, 78, { bold: true, size: 9, width: 74, maxLines: 3 });
    label(doc, "Texto de publicación", 98, 103);
    text(doc, item.copy || "Sin texto agregado", 98, 115, { size: 8.5, width: 74, maxLines: 14 });
    label(doc, "Referencia visual", 187, 66);
    doc.setFillColor(231, 240, 235);
    doc.setDrawColor(201, 217, 208);
    doc.roundedRect(187, 74, 88, 101, 3, 3, "FD");
    if (item.mediaUrl && item.mediaType === "image") {
      try { addContainedImage(doc, item.mediaUrl, 190, 77, 82, 95); }
      catch { text(doc, item.productionReference || "Referencia visual adjunta", 231, 126, { bold: true, size: 9, color: GREEN, align: "center", width: 72, maxLines: 5 }); }
    } else {
      text(doc, item.mediaType === "video" ? "VIDEO ADJUNTO EN EL PORTAL" : item.productionReference || "IMAGEN / IDEA POR DEFINIR", 231, 126, { bold: true, size: 9, color: GREEN, align: "center", width: 72, maxLines: 5 });
    }
    pageFooter(doc, period, nextPageNumber + index);
  });

  return doc;
}
