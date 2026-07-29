import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { environment } from '../src/environments/environment';

// import { buildHeader } from './invoice-header';
// import { buildTableAndSummary } from './invoice-table';
// import { buildSignatureAndGatePass } from './invoice-footer';
// import { formatAmPm } from './invoice-utils';
import { buildHeader } from '../src/app/pdf/invoice-header';
import { buildTableAndSummary } from '../src/app/pdf/invoice-table';
import { buildSignatureAndGatePass } from '../src/app/pdf/invoice-footer';
import { formatAmPm } from '../src/app/pdf/invoice-utils';

// Load the bundled Roboto fonts into pdfmake's virtual file system
(pdfMake as any).vfs = (pdfFonts as any).pdfMake
  ? (pdfFonts as any).pdfMake.vfs
  : (pdfFonts as any).vfs;

const SPINNER_HTML = `
  <html><head><title>Generating PDF...</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center;
           justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .box { text-align: center; padding: 40px; background: #fff;
           border-radius: 8px; box-shadow: 0 2px 16px rgba(0,0,0,.12); }
    .spinner { border: 4px solid #e0e0e0; border-top: 4px solid #1a73e8;
               border-radius: 50%; width: 48px; height: 48px;
               animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { color: #333; margin: 0 0 8px; font-size: 1.2rem; }
    p  { color: #888; margin: 0; font-size: 0.9rem; }
  </style></head>
  <body><div class="box">
    <div class="spinner"></div>
    <h2>Generating PDF</h2>
    <p>Please wait a moment...</p>
  </div></body></html>
`;

@Injectable({
  providedIn: 'root'
})
export class InvoicePdfService {

  constructor() {}

  /**
   * Fetches any image URL (local asset or backend URL) and converts to base64 data URL.
   */
  private async getBase64FromUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror  = () => resolve('');
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Could not load image:', url, err);
      return '';
    }
  }

  /**
   * Generates and views the invoice PDF entirely in the frontend.
   * Strategy:
   *   1. Open a popup window IMMEDIATELY (synchronous, counts as user-gesture).
   *   2. Show a spinner inside it.
   *   3. Build the PDF asynchronously.
   *   4. Navigate the SAME popup window to the blob URL — this is allowed
   *      because we already hold a reference to it; no second window.open() needed.
   */
  public async generateAndOpenPDF(inv: any, items: any[], preOpenedWindow?: Window | null): Promise<void> {

    // Use the pre-opened window if caller already opened one (avoids popup blocker),
    // otherwise open a fresh popup now (only works if called directly from user click).
    const pdfWindow = preOpenedWindow ?? window.open('', '_blank');
    if (!pdfWindow) {
      alert('Please allow popups for this site to view the PDF.');
      return;
    }

    // Step 2 — Show spinner in the already-open popup.
    pdfWindow.document.open();
    pdfWindow.document.write(SPINNER_HTML);
    pdfWindow.document.close();

    try {
      // Step 3 — Build PDF content (async is fine now; popup is already open).
      // Determine logo URL:
      //   1. If branch has a custom logo uploaded → fetch from backend /uploads/logos/
      //   2. Else if brand is KTM → use bundled KTM asset
      //   3. Else → use bundled Bajaj asset
      let logoUrl: string;
      if (inv.branch_logo_url) {
        // branch_logo_url is like "/uploads/logos/logo_xxx.png" — prepend backend base URL
        const cleanPath = inv.branch_logo_url.replace(/^\/+/, '');
        logoUrl = `${environment.FilePath}/${cleanPath}`;
      } else if (inv.active_brand && inv.active_brand.toLowerCase().includes('ktm')) {
        logoUrl = '/assets/KtmLogo.png';
      } else {
        logoUrl = '/assets/BajajLogo.png';
      }
      const logoDataUrl = await this.getBase64FromUrl(logoUrl);

      const headerContent = await buildHeader(inv, logoDataUrl);
      const tableContent  = buildTableAndSummary(inv, items);
      const footerContent = buildSignatureAndGatePass(inv);

      const docDefinition: TDocumentDefinitions = {
        pageSize: 'A4',
        pageMargins: [30, 10, 30, 15],
        defaultStyle: { fontSize: 7.5, color: '#000' },
        content: [...headerContent, ...tableContent, ...footerContent],
        footer: (currentPage: number, pageCount: number) => ({
          columns: [
            { text: `Printed On: ${formatAmPm(new Date())}`, fontSize: 7, margin: [30, 0, 0, 0] },
            { text: `Page ${currentPage}/${pageCount}`, fontSize: 7, alignment: 'right', margin: [0, 0, 30, 0] }
          ]
        })
      };

      // Step 4 — Generate blob (pdfmake 0.3.x returns a Promise, not a callback!)
      const pdfDocGenerator = (pdfMake as any).createPdf(docDefinition);
      const blob: Blob = await pdfDocGenerator.getBlob();

      // Add a small artificial delay so the user can actually see the loading spinner
      await new Promise(resolve => setTimeout(resolve, 700));

      // Navigate the EXISTING popup to the blob URL — not blocked by popup blocker
      const blobUrl = URL.createObjectURL(blob);
      pdfWindow.location.replace(blobUrl);

      // Free memory after PDF has loaded
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);

    } catch (e) {
      console.error('PDF Generation Error:', e);
      try {
        pdfWindow.document.open();
        pdfWindow.document.write(`
          <html><body style="font-family:sans-serif;padding:40px;">
            <h2 style="color:red;">Failed to generate PDF</h2>
            <pre style="background:#f5f5f5;padding:16px;border-radius:4px;white-space:pre-wrap;">${e}</pre>
          </body></html>
        `);
        pdfWindow.document.close();
      } catch (_) {}
    }
  }
}
