const COLORS = {
  blue: "315BFF",
  green: "20B486",
  violet: "7758E8",
  ink: "172033",
  muted: "667085",
  paper: "F7F9FF",
  line: "DCE4F2",
  white: "FFFFFF",
};

export async function createCalendarPptxFromPdf({ document: pdfDocument, title }) {
  if (typeof window === "undefined" || typeof document === "undefined")
    throw new Error("La exportación de diapositivas requiere un navegador.");
  const [{ default: PptxGenJS }, pdfjs] = await Promise.all([
    import("pptxgenjs"),
    import("pdfjs-dist/build/pdf.mjs"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).href;
  const source = pdfDocument.output("arraybuffer");
  const pdf = await pdfjs.getDocument({ data: source }).promise;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "PDF_A4_LANDSCAPE", width: 11.69, height: 8.27 });
  pptx.layout = "PDF_A4_LANDSCAPE";
  pptx.author = "FOCUGEX";
  pptx.title = title;
  pptx.subject = title;
  pptx.lang = "es-EC";
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 4 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    await page.render({ canvasContext: context, viewport }).promise;
    const slide = pptx.addSlide();
    slide.background = { color: "F7F9FF" };
    slide.addImage({
      data: canvas.toDataURL("image/png", .96),
      x: 0,
      y: 0,
      w: 11.69,
      h: 8.27,
    });
    page.cleanup();
  }
  if (typeof pdf.cleanup === "function") pdf.cleanup();
  return pptx;
}

function addHeader(slide, company, periodLabel, logoData) {
  slide.addText("CRONOGRAMA", { x: .45, y: .18, w: 1.55, h: .38, fontFace: "Aptos Display", fontSize: 16, bold: true, color: COLORS.ink, margin: 0, fit: "shrink" });
  slide.addText("de contenido", { x: .45, y: .57, w: 1.4, h: .2, fontFace: "Aptos", fontSize: 9, color: COLORS.green, margin: 0 });
  slide.addShape("line", { x: 2.05, y: .25, w: 0, h: .55, line: { color: COLORS.green, width: 2 } });
  slide.addText(periodLabel.toUpperCase(), { x: 2.25, y: .3, w: 3.5, h: .22, fontFace: "Aptos", fontSize: 9, bold: true, color: COLORS.green, margin: 0 });
  slide.addText("Planificación de redes sociales", { x: 2.25, y: .57, w: 3.5, h: .18, fontFace: "Aptos", fontSize: 7, color: COLORS.muted, margin: 0 });
  if (logoData) slide.addImage({ data: logoData, x: 11.35, y: .2, w: 1.4, h: .65, sizing: "contain" });
  else slide.addText(company, { x: 10.2, y: .34, w: 2.55, h: .3, fontSize: 13, bold: true, color: COLORS.green, align: "right", margin: 0 });
}

function addFooter(slide, period, page) {
  slide.addShape("line", { x: .45, y: 7.18, w: 12.4, h: 0, line: { color: COLORS.green, width: 1 } });
  slide.addText("PLANIFICAMOS HOY PARA CONECTAR MAÑANA", { x: .5, y: 7.25, w: 4, h: .12, fontSize: 5.5, bold: true, color: COLORS.green, margin: 0 });
  slide.addText(`${period} · ${String(page).padStart(2, "0")}`, { x: 10.7, y: 7.25, w: 2.1, h: .12, fontSize: 5.5, bold: true, color: COLORS.green, align: "right", margin: 0 });
}

function baseSlide(pptx) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.paper };
  return slide;
}

function fittedFont(value, preferred, capacity, minimum = 5.5) {
  const length = String(value || "").length;
  if (!length || length <= capacity) return preferred;
  return Math.max(minimum, Number((preferred * Math.sqrt(capacity / length)).toFixed(1)));
}

export async function createCalendarPptx({ company, logoData, period, plan, publications }) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "FOCUGEX";
  pptx.company = company;
  pptx.subject = `Cronograma de contenido ${period}`;
  pptx.title = `Cronograma ${company} ${period}`;
  pptx.lang = "es-EC";
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos", lang: "es-EC" };
  const date = new Date(`${period}-01T12:00:00`);
  const periodLabel = date.toLocaleDateString("es-EC", { month: "long", year: "numeric" });
  let page = 1;

  let slide = baseSlide(pptx);
  addHeader(slide, company, periodLabel, logoData);
  slide.addShape("roundRect", { x: .45, y: 1.35, w: 12.4, h: 1.25, rectRadius: .08, fill: { color: COLORS.blue }, line: { color: COLORS.blue } });
  slide.addText(company, { x: .8, y: 1.68, w: 5.4, h: .4, fontSize: 24, bold: true, color: COLORS.white, margin: 0 });
  slide.addText(periodLabel, { x: 6.5, y: 1.76, w: 5.5, h: .28, fontSize: 15, bold: true, color: COLORS.white, align: "right", margin: 0 });
  const metrics = [["CONTENIDOS", publications.length], ["POSTS POR SEMANA", plan?.postsPerWeek || 0], ["VIDEOS DEL MES", plan?.videosPerMonth || 0]];
  metrics.forEach(([label, value], index) => {
    const x = .45 + index * 4.2;
    slide.addShape("roundRect", { x, y: 2.95, w: 3.95, h: 1.2, rectRadius: .05, fill: { color: COLORS.white }, line: { color: COLORS.line } });
    slide.addText(label, { x: x + .25, y: 3.2, w: 2.8, h: .18, fontSize: 7, bold: true, color: COLORS.muted, margin: 0 });
    slide.addText(String(value), { x: x + .25, y: 3.55, w: 2, h: .4, fontSize: 22, bold: true, color: COLORS.green, margin: 0 });
  });
  slide.addText("RESUMEN DE ESTRATEGIA", { x: .55, y: 4.75, w: 2.6, h: .18, fontSize: 7, bold: true, color: COLORS.blue, margin: 0 });
  slide.addText(plan?.strategySummary || "Sin estrategia mensual registrada.", { x: .55, y: 5.12, w: 11.8, h: 1.35, fontSize: 12, color: COLORS.ink, breakLine: false, valign: "top", margin: 0 });
  addFooter(slide, period, page++);

  slide = baseSlide(pptx);
  addHeader(slide, company, periodLabel, logoData);
  slide.addText("Plan de contenido del mes", { x: .55, y: 1.15, w: 7, h: .4, fontSize: 22, bold: true, color: COLORS.ink, margin: 0 });
  const planRows = [
    ["POSTS", `${plan?.postsPerWeek || 0} espacios por semana`, plan?.postsDetail || "Sin distribución definida"],
    ["VIDEOS", `${plan?.videosPerMonth || 0} durante el mes`, plan?.videosDetail || "Sin tipos definidos"],
    ["PAUTA", plan?.videoSchedule || "Sin fechas", plan?.videoBoostDetail || "Sin frecuencia"],
    ["LÍNEAS", `${plan?.mainLinesCount || 0} líneas principales`, plan?.mainLines || "Sin líneas definidas"],
  ];
  planRows.forEach(([name, value, detail], index) => {
    const y = 1.8 + index * 1.15;
    slide.addShape("roundRect", { x: .55, y, w: 12.2, h: .92, rectRadius: .04, fill: { color: COLORS.white }, line: { color: COLORS.line } });
    slide.addText(name, { x: .8, y: y + .18, w: 1.3, h: .2, fontSize: 7, bold: true, color: COLORS.blue, margin: 0 });
    slide.addText(value, { x: 2.25, y: y + .15, w: 3.4, h: .4, fontSize: 12, bold: true, color: COLORS.green, margin: 0 });
    slide.addText(detail, { x: 5.85, y: y + .14, w: 6.5, h: .5, fontSize: 9, color: COLORS.ink, margin: 0, fit: "shrink" });
  });
  addFooter(slide, period, page++);

  const keyDates = [];
  for (let start = 0; start < keyDates.length; start += 5) {
    slide = baseSlide(pptx);
    addHeader(slide, company, periodLabel, logoData);
    slide.addText(`Fechas clave del mes (${keyDates.length})`, { x: .55, y: 1.12, w: 7, h: .4, fontSize: 22, bold: true, color: COLORS.ink, margin: 0 });
    keyDates.slice(start, start + 5).forEach((item, index) => {
      const y = 1.75 + index * 1.02;
      const day = new Date(`${item.date}T12:00:00`).toLocaleDateString("es-EC", { day: "2-digit", month: "short" }).toUpperCase();
      slide.addShape("roundRect", { x: .55, y, w: 12.2, h: .82, rectRadius: .04, fill: { color: COLORS.white }, line: { color: COLORS.line } });
      slide.addShape("roundRect", { x: .78, y: y + .2, w: 1.05, h: .35, rectRadius: .03, fill: { color: item.format === "reel" ? COLORS.violet : COLORS.blue }, line: { color: item.format === "reel" ? COLORS.violet : COLORS.blue } });
      slide.addText(day, { x: .82, y: y + .27, w: .97, h: .12, fontSize: 6.5, bold: true, color: COLORS.white, align: "center", margin: 0 });
      slide.addText(item.title, { x: 2.08, y: y + .18, w: 3.35, h: .4, fontSize: 12, bold: true, color: COLORS.green, margin: 0, fit: "shrink" });
      slide.addText(item.description || "Contenido por desarrollar", { x: 5.55, y: y + .15, w: 6.75, h: .5, fontSize: 8.5, color: COLORS.ink, margin: 0, fit: "shrink" });
    });
    addFooter(slide, period, page++);
  }

  publications.forEach((item) => {
    slide = baseSlide(pptx);
    addHeader(slide, company, periodLabel, logoData);
    slide.addShape("roundRect", { x: .45, y: 1.15, w: 3.05, h: 5.75, rectRadius: .04, fill: { color: COLORS.green }, line: { color: COLORS.green } });
    slide.addText("PLATAFORMAS Y DATOS", { x: .7, y: 1.4, w: 2.55, h: .2, fontSize: 8, bold: true, color: COLORS.white, align: "center", margin: 0 });
    const facts = [
      ["PLATAFORMAS", (item.platforms || []).join(" · ") || "Sin plataformas"],
      ["FECHA", new Date(`${item.date}T12:00:00`).toLocaleDateString("es-EC")],
      ["FORMATO", String(item.format || "post").toUpperCase()],
      ["ESTADO", item.isDraftSlot ? "POR COMPLETAR" : item.approvalStatus === "approved" ? "APROBADO" : "PENDIENTE"],
      ["REFERENCIA", item.productionReference || "Sin referencia agregada"],
    ];
    facts.forEach(([name, value], index) => {
      const y = 1.85 + index * .82;
      slide.addText(name, { x: .75, y, w: 2.4, h: .14, fontSize: 6, bold: true, color: "DDF6ED", margin: 0 });
      slide.addText(value, { x: .75, y: y + .22, w: 2.4, h: .42, fontSize: fittedFont(value, 8.5, 70, 5.5), bold: true, color: COLORS.white, margin: 0, fit: "shrink", valign: "top" });
    });
    slide.addShape("roundRect", { x: 3.72, y: 1.15, w: 9.13, h: 5.75, rectRadius: .04, fill: { color: COLORS.white }, line: { color: COLORS.line } });
    slide.addShape("rect", { x: 3.72, y: 1.15, w: 9.13, h: .62, fill: { color: COLORS.blue }, line: { color: COLORS.blue } });
    slide.addText(item.topic || "Sin título", { x: 4, y: 1.34, w: 8.55, h: .22, fontSize: 15, bold: true, color: COLORS.white, align: "center", margin: 0, fit: "shrink" });
    slide.addText("OBJETIVO", { x: 4.05, y: 2.03, w: 1.2, h: .14, fontSize: 7, bold: true, color: COLORS.blue, margin: 0 });
    slide.addText(item.objective || "Sin objetivo agregado", { x: 4.05, y: 2.3, w: 3.65, h: .75, fontSize: fittedFont(item.objective, 10, 180, 6), bold: true, color: COLORS.ink, margin: 0, fit: "shrink", valign: "top" });
    slide.addText("TEXTO DE PUBLICACIÓN", { x: 4.05, y: 3.18, w: 2.2, h: .14, fontSize: 7, bold: true, color: COLORS.blue, margin: 0 });
    slide.addText(item.copy || "Sin texto agregado", { x: 4.05, y: 3.48, w: 3.65, h: 2.85, fontFace: "Segoe UI Emoji", fontSize: fittedFont(item.copy, 9, 620, 5.5), color: COLORS.ink, margin: .02, fit: "shrink", valign: "top", breakLine: true });
    slide.addText("REFERENCIA VISUAL", { x: 8.05, y: 2.03, w: 1.9, h: .14, fontSize: 7, bold: true, color: COLORS.blue, margin: 0 });
    slide.addShape("roundRect", { x: 8.05, y: 2.3, w: 4.35, h: 4.05, rectRadius: .04, fill: { color: "EEF3F8" }, line: { color: COLORS.line } });
    if (item.mediaUrl && item.mediaType === "image") slide.addImage({ data: item.mediaUrl, x: 8.18, y: 2.43, w: 4.09, h: 3.79, sizing: "contain" });
    else slide.addText(item.mediaType === "video" ? "VIDEO ADJUNTO EN EL PORTAL" : item.productionReference || "IMAGEN / IDEA POR DEFINIR", { x: 8.45, y: 3.85, w: 3.55, h: .65, fontSize: 11, bold: true, color: COLORS.green, align: "center", valign: "mid", margin: 0, fit: "shrink" });
    addFooter(slide, period, page++);
  });

  slide = baseSlide(pptx);
  addHeader(slide, company, periodLabel, logoData);
  slide.addText(`Calendario de ${periodLabel}`, { x: .55, y: 1.02, w: 7, h: .35, fontSize: 21, bold: true, color: COLORS.ink, margin: 0 });
  const firstOffset = (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7;
  const monthDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const rowCount = Math.ceil((firstOffset + monthDays) / 7);
  const cellW = 1.72;
  const cellH = 4.95 / rowCount;
  ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].forEach((day, index) => {
    slide.addShape("roundRect", { x: .55 + index * cellW, y: 1.55, w: 1.62, h: .35, rectRadius: .03, fill: { color: COLORS.green }, line: { color: COLORS.green } });
    slide.addText(day, { x: .58 + index * cellW, y: 1.66, w: 1.56, h: .08, fontSize: 6.5, bold: true, color: COLORS.white, align: "center", margin: 0 });
  });
  for (let cell = 0; cell < rowCount * 7; cell += 1) {
    const day = cell - firstOffset + 1;
    const col = cell % 7;
    const row = Math.floor(cell / 7);
    const x = .55 + col * cellW;
    const y = 1.98 + row * cellH;
    slide.addShape("roundRect", { x, y, w: 1.62, h: cellH - .08, rectRadius: .025, fill: { color: day > 0 && day <= monthDays ? COLORS.white : "F0F3F7" }, line: { color: COLORS.line } });
    if (day < 1 || day > monthDays) continue;
    slide.addText(String(day), { x: x + .08, y: y + .07, w: .3, h: .12, fontSize: 7, bold: true, color: COLORS.ink, margin: 0 });
    const dayKey = `${period}-${String(day).padStart(2, "0")}`;
    publications.filter((item) => item.date === dayKey).slice(0, 2).forEach((item, index) => {
      slide.addText(`${String(item.format || "post").toUpperCase()}${item.isDraftSlot ? " · PENDIENTE" : ""}`, { x: x + .08, y: y + .3 + index * .32, w: 1.42, h: .1, fontSize: 5, bold: true, color: item.format === "reel" ? COLORS.violet : COLORS.green, margin: 0 });
      slide.addText(item.topic || "Sin título", { x: x + .08, y: y + .43 + index * .32, w: 1.42, h: .13, fontSize: 5.5, bold: true, color: COLORS.ink, margin: 0, fit: "shrink" });
    });
  }
  addFooter(slide, period, page);
  return pptx;
}
