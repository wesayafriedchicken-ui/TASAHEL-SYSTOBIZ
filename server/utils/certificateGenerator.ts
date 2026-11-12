import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateCertificate(userName: string, courseTitle: string, date: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Background color
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.98, 0.98),
  });

  // Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.1, 0.5, 0.3),
    borderWidth: 5,
  });

  page.drawText('CERTIFICATE OF COMPLETION', {
    x: 100,
    y: 320,
    size: 30,
    font,
    color: rgb(0.1, 0.5, 0.3),
  });

  page.drawText('This is to certify that', {
    x: 220,
    y: 270,
    size: 15,
    font: regularFont,
  });

  page.drawText(userName.toUpperCase(), {
    x: (width - font.widthOfTextAtSize(userName.toUpperCase(), 25)) / 2,
    y: 230,
    size: 25,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText('has successfully completed the training course', {
    x: 160,
    y: 190,
    size: 15,
    font: regularFont,
  });

  page.drawText(courseTitle, {
    x: (width - font.widthOfTextAtSize(courseTitle, 20)) / 2,
    y: 160,
    size: 20,
    font,
    color: rgb(0.1, 0.4, 0.7),
  });

  page.drawText(`Issued on: ${date}`, {
    x: 230,
    y: 100,
    size: 12,
    font: regularFont,
  });

  page.drawText('The Business Core Engine', {
    x: 220,
    y: 50,
    size: 14,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}
