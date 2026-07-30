import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, Content, Table, Column } from 'pdfmake/interfaces';
import { formatAmPm } from './invoice-utils'; 
import { BrandService } from '../services/brand.service';

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
               animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style></head><body>
  <div class="box"><div class="spinner"></div><h2>Generating Document</h2>
  <p>Please wait while your PDF is being created...</p></div>
  </body></html>
`;

@Injectable({
  providedIn: 'root'
})
export class VehicleHistoryPdfService {

  constructor(private brandService: BrandService) { }

  private fmtDate(d: any): string {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) {
      return String(d).substring(0, 10);
    }
    const day = dt.getDate().toString().padStart(2, '0');
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}/${month}/${year}`;
  }

  generatePdf(customer: any, invoices: any[]) {
    const pdfTitle = `${customer?.c_reg_no || 'Vehicle'} - vehicle history.pdf`;

    const config = this.brandService.getBrandConfig() as any;
    const activeBrand = { 
      brand_title: config?.brand_title || config?.brand_name || 'SARATHY MOTORS', 
      brand_dealer_code: config?.brand_dealer_code || '-' 
    };

    // Open an intermediate window to show a loading spinner
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(SPINNER_HTML.replace('<title>Generating PDF...</title>', `<title>${pdfTitle}</title>`));
      newWindow.document.title = pdfTitle;
      newWindow.document.close();
    }

    setTimeout(async () => {
      try {
        const docDefinition: TDocumentDefinitions = {
          info: {
            title: pdfTitle
          },
          pageSize: 'A4',
          pageMargins: [30, 30, 30, 30],
          defaultStyle: {
            font: 'Roboto',
            fontSize: 8,
          },
          content: this.buildContent(customer, invoices, activeBrand)
        };

        const pdfDocGenerator = (pdfMake as any).createPdf(docDefinition);

        if (newWindow) {
          const blob: Blob = await pdfDocGenerator.getBlob();
          const url = URL.createObjectURL(blob);
          newWindow.location.replace(url);
        } else {
          pdfDocGenerator.open();
        }

      } catch (error) {
        console.error('Error generating PDF:', error);
        if (newWindow) {
          newWindow.document.write('<h2>Error generating PDF</h2>');
          newWindow.document.close();
        }
      }
    }, 100);
  }

  private buildContent(customer: any, invoices: any[], activeBrand: any): Content[] {
    const content: Content[] = [];

    // Title
    content.push({
      text: 'VEHICLE HISTORY',
      fontSize: 16,
      bold: true,
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });

    // Divider
    content.push({
      canvas: [
        { type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1 }
      ],
      margin: [0, 0, 0, 10]
    });

    const buildHeaderRow = (l1: string, v1: any, l2: string, v2: any) => {
      return {
        columns: [
          { width: 85, text: l1 },
          { width: 10, text: ':' },
          { width: 145, text: String(v1 || '-').replace(/\r/g, '') },
          { width: 85, text: l2 },
          { width: 10, text: ':' },
          { width: 200, text: String(v2 || '-').replace(/\r/g, '') }
        ],
        margin: [0, 0, 0, 4] as [number, number, number, number]
      };
    };

    content.push(buildHeaderRow('Selling Dealer', activeBrand.brand_title, 'Dealer Code', activeBrand.brand_dealer_code));
    content.push(buildHeaderRow('Customer Name', customer?.c_name, 'Address', customer?.c_address || 'Kollam'));
    content.push(buildHeaderRow('Contact No', customer?.c_contact_no, 'Model', customer?.model_name));
    content.push(buildHeaderRow('Chassis No', customer?.c_chassis_no, 'Engine No', customer?.c_engine_no));
    content.push(buildHeaderRow('Date Of Sale', this.fmtDate(customer?.c_sales_date), 'Reg No', customer?.c_reg_no));

    // Divider
    content.push({
      canvas: [
        { type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1 }
      ],
      margin: [0, 5, 0, 15]
    });

    // Loop over invoices
    (invoices || []).forEach((inv: any, idx: number) => {
      content.push({
        stack: [
          // Visit Header Line
          {
            columns: [
              { text: `Visit : ${idx + 1}`, bold: true, fontSize: 9, width: 130 },
              { text: `JobCard No : ${inv.inv_job_card_no || '-'}`, bold: true, fontSize: 9, width: 255 },
              { text: `Invoice No : ${inv.inv_no || '-'}`, bold: true, fontSize: 9, width: 150, alignment: 'right' }
            ],
            margin: [0, 0, 0, 5]
          },
          // Visit Table
          {
            table: {
              headerRows: 1,
              widths: [90, 70, 100, 180, '*'],
              body: [
                [
                  { text: 'Date Of Visit', bold: true, fontSize: 8, margin: [2, 2, 2, 2] },
                  { text: 'Kms', bold: true, fontSize: 8, margin: [2, 2, 2, 2] },
                  { text: 'Job Type', bold: true, fontSize: 8, margin: [2, 2, 2, 2] },
                  { text: 'Service Dealer', bold: true, fontSize: 8, margin: [2, 2, 2, 2] },
                  { text: 'Dealer Code', bold: true, fontSize: 8, margin: [2, 2, 2, 2] }
                ],
                [
                  { text: this.fmtDate(inv.inv_jcard_date), fontSize: 7, margin: [2, 2, 2, 2] },
                  { text: String(inv.inv_km || '-'), fontSize: 7, margin: [2, 2, 2, 2] },
                  { text: String(inv.inv_repair_typ || 'Paid service'), fontSize: 7, margin: [2, 2, 2, 2] },
                  { text: String(inv.branch_name || 'Sarathy Bajaj'), fontSize: 7, margin: [2, 2, 2, 2] },
                  { text: String(activeBrand.brand_dealer_code), fontSize: 7, margin: [2, 2, 2, 2] }
                ]
              ]
            },
            layout: 'borders',
            margin: [0, 0, 0, 10]
          }
        ],
        unbreakable: true
      });

      // Services Table
      const servicesBody: any[] = [];
      // Column Header row
      servicesBody.push([
        { text: 'Service Name', bold: true, fontSize: 8, margin: [2, 2, 2, 2] },
        { text: 'Job Type', bold: true, fontSize: 8, margin: [2, 2, 2, 2] },
        { text: 'Taxable Amount', bold: true, alignment: 'right', fontSize: 8, margin: [2, 2, 2, 2] },
        { text: 'Discount Amount', bold: true, alignment: 'right', fontSize: 8, margin: [2, 2, 2, 2] },
        { text: 'Amount', bold: true, alignment: 'right', fontSize: 8, margin: [2, 2, 2, 2] }
      ]);

      let visitTaxable = 0;
      let visitDisc = 0;
      let visitTotal = 0;

      (inv.items || []).forEach((item: any) => {
        const amt = parseFloat(item.lc_amount || 0);
        const tax = parseFloat(item.lc_tax_amunt || 0);
        const disc = parseFloat(item.lc_disc || 0);
        
        visitTaxable += tax;
        visitDisc += disc;
        visitTotal += amt;

        servicesBody.push([
          { text: item.lc_lb_name || '-', fontSize: 7, margin: [2, 2, 2, 2] },
          { text: 'P', fontSize: 7, margin: [2, 2, 2, 2] },
          { text: tax.toFixed(2), alignment: 'right', fontSize: 7, margin: [2, 2, 2, 2] },
          { text: disc.toFixed(2), alignment: 'right', fontSize: 7, margin: [2, 2, 2, 2] },
          { text: amt.toFixed(2), alignment: 'right', fontSize: 7, margin: [2, 2, 2, 2] }
        ]);
      });

      if (inv.items?.length > 0) {
        content.push({
          stack: [
            {
              text: 'Services Done',
              bold: true,
              fontSize: 9,
              margin: [0, 0, 0, 5]
            },
            {
              table: {
                headerRows: 1,
                widths: [200, 90, 80, 80, '*'],
                body: servicesBody
              },
              layout: 'borders',
              margin: [0, 0, 0, 10]
            }
          ],
          unbreakable: true
        });
      } else {
        content.push({ text: 'No services found.', fontSize: 7, margin: [0, 0, 0, 10] });
      }

      // Totals
      const buildTotalRow = (lbl: string, val: string) => {
        return {
          columns: [
            { width: 120, text: lbl, bold: true },
            { width: 10, text: ':' },
            { width: '*', text: val }
          ],
          margin: [0, 0, 0, 4] as [number, number, number, number],
          unbreakable: true
        };
      };

      content.push(buildTotalRow('Total Taxable Amount', visitTaxable.toFixed(2)));
      content.push(buildTotalRow('Total Discount Amount', visitDisc.toFixed(2)));
      content.push(buildTotalRow('Total Bill Amount', visitTotal.toFixed(2)));

      content.push({
        columns: [
          { width: 240, text: `Supervisor Name : ${inv.advisor_name || '-'}` },
          { width: '*', text: `Mechanic Name : ${inv.mechanic_name || '-'}` }
        ],
        margin: [0, 10, 0, 10],
        unbreakable: true
      });

      // Bottom divider for visit
      content.push({
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.5 }
        ],
        margin: [0, 10, 0, 15]
      });
    });

    return content;
  }
}
