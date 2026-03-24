import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-job-card-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-card-detail.component.html',
  styleUrls: ['./job-card-detail.component.css']
})
export class JobCardDetailComponent implements OnInit {
  id: number = 0;
  data: any = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.id = +params['id'];
      if (this.id) {
        this.fetchDetails();
      }
    });
  }

  fetchDetails(): void {
    this.loading = true;
    this.api.getInvoice(this.id).subscribe({
      next: (res: any) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        this.notify.error('Failed to load job card details');
        this.loading = false;
      }
    });
  }

  exportExcel(): void {
    if (!this.data) {
      this.notify.error('No data to export');
      return;
    }

    const { invoice, items } = this.data;
    const filename = `JobCard_${invoice.inv_job_card_no || this.id}.xls`;

    // Helper for numeric formatting
    const num = (v: any) => isNaN(parseFloat(v)) ? '0.00' : parseFloat(v).toFixed(2);

    // 1. Create a structured HTML for Excel matching the "professional invoice" requirement with a full grid
    // We'll use a fixed 15-column layout for EVERY row to ensure it looks like a continuous grid.
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Job Card Details</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; table-layout: fixed; width: 100%; }
          td, th { 
            border: .5pt solid #000000; 
            mso-border-alt: .5pt solid windowtext;
            padding: 5px 8px; 
            font-family: Calibri, sans-serif; 
            font-size: 11pt; 
            white-space: nowrap; 
          }
          .title-row th { font-size: 14pt; font-weight: bold; text-align: center; background-color: #ffffff; padding: 10px 0; }
          .header-row td { background-color: #f2f2f2; font-weight: bold; text-align: center; }
          .center { text-align: center; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <table border="1">
          <!-- Section 1 Title -->
          <tr class="title-row"><th colspan="15">Jobcard & Invoice Details</th></tr>
          
          <!-- Section 1 Headers -->
          <tr class="header-row">
            <td>Sl.No</td>
            <td>Jobcard No</td>
            <td>Jobcard Date</td>
            <td>Invoice No</td>
            <td>Invoice Date</td>
            <td>Registration No</td>
            <td>Customer Name</td>
            <td>Mobile No</td>
            <td>Customer GSTIN</td>
            <td>Model Name</td>
            <td>KM Reading</td>
            <td>Repair Type</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>

          <!-- Section 1 Data Row -->
          <tr>
            <td class="center">1</td>
            <td>${invoice.inv_job_card_no || ''}</td>
            <td>${invoice.inv_jcard_date || ''}</td>
            <td>${invoice.inv_no || ''}</td>
            <td>${invoice.inv_inv_date || ''}</td>
            <td>${invoice.in_registr || ''}</td>
            <td>${invoice.inv_cus || ''}</td>
            <td>${invoice.inv_pho || ''}</td>
            <td>${invoice.inv_cus_gstin || ''}</td>
            <td>${invoice.inv_modl || ''}</td>
            <td class="center">${invoice.inv_km || ''}</td>
            <td>${invoice.inv_repair_typ || ''}</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>

          <!-- Spacer Row - Full 15 columns to keep the grid -->
          <tr>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>
          
          <!-- Section 2 Title -->
          <tr class="title-row"><th colspan="15">Tax Invoice</th></tr>

          <!-- Section 2 Headers -->
          <tr class="header-row">
            <td>Sl.No</td>
            <td>Labour Code</td>
            <td>Labour Name</td>
            <td>Rate</td>
            <td>Discount</td>
            <td>Taxable</td>
            <td>UTGST(%)</td>
            <td>UTGST</td>
            <td>CGST(%)</td>
            <td>CGST</td>
            <td>Amount</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>
    `;

    // Section 2 Data Rows (each item in a separate row, ensuring 15 columns total)
    items.forEach((item: any, index: number) => {
      html += `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${item.lc_lab_code || ''}</td>
          <td>${item.lc_lb_name || ''}</td>
          <td class="right">${num(item.lc_rate)}</td>
          <td class="right">${num(item.lc_disc)}</td>
          <td class="right">${num(item.lc_tax_amunt)}</td>
          <td class="center">${item.lc_sgst_p || 9.0}</td>
          <td class="right">${num(item.lc_sgst_a)}</td>
          <td class="center">${item.lc_cgst_p || 9.0}</td>
          <td class="right">${num(item.lc_cgst_a)}</td>
          <td class="right">${num(item.lc_amount)}</td>
          <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
        </tr>
      `;
    });

    // Final trailing empty rows to show "all the cells" grid at the bottom
    for (let i = 0; i < 3; i++) {
      html += `
        <tr>
          <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
        </tr>
      `;
    }

    html += `
        </table>
      </body>
      </html>
    `;

    // 2. Download Blob
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    this.notify.success('Excel exported successfully');
  }

  exportPdf(): void {
    if (!this.id) return;
    const url = this.api.getInvoicePDFUrl(this.id);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const pdfUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
    window.open(pdfUrl, '_blank');
  }

  exportWord(): void {
    if (!this.id) return;
    const url = this.api.getInvoiceWordUrl(this.id);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const wordUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
    window.open(wordUrl, '_blank');
  }

  sendEmail(): void {
    this.notify.info('Email functionality coming soon');
  }
}
