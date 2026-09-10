import QRCode from "qrcode";

function pdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/([\\()])/g, "\\$1");
}

export function createClubQrPdf(storeUrl: string, clubName: string) {
  const qr = QRCode.create(storeUrl, { errorCorrectionLevel: "H" });
  const moduleCount = qr.modules.size;
  const moduleSize = Math.max(1, Math.floor(360 / (moduleCount + 8)));
  const qrSize = moduleCount * moduleSize;
  const startX = Math.floor((595 - qrSize) / 2);
  const startY = 310;
  const commands = [
    "1 1 1 rg 0 0 595 842 re f",
    "0.055 0.039 0.102 rg",
    "BT /F1 23 Tf 1 0 0 1 56 764 Tm (Tienda oficial) Tj ET",
    `BT /F1 17 Tf 1 0 0 1 56 731 Tm (${pdfText(clubName)}) Tj ET`,
    "0.18 0.016 0.439 rg 56 704 483 4 re f",
    "0 0 0 rg",
  ];

  for (let row = 0; row < moduleCount; row += 1) {
    for (let column = 0; column < moduleCount; column += 1) {
      if (qr.modules.data[row * moduleCount + column] !== 1) continue;
      const x = startX + column * moduleSize;
      const y = startY + (moduleCount - row - 1) * moduleSize;
      commands.push(`${x} ${y} ${moduleSize} ${moduleSize} re f`);
    }
  }

  commands.push(
    "0.29 0.27 0.38 rg",
    "BT /F1 11 Tf 1 0 0 1 56 255 Tm (Escanea el codigo para abrir la tienda del club) Tj ET",
    `BT /F1 8 Tf 1 0 0 1 56 230 Tm (${pdfText(storeUrl).slice(0, 94)}) Tj ET`,
  );

  const content = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}
