import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { InvoicePdfService } from '../../../pdf/invoice-pdf.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-invoice-list', standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit {
  labourInvoices:any[]=[]; insuranceInvoices:any[]=[];
  activeTab: string = 'labour';
  
  constructor(
    public api: ApiService,
    private notify: NotificationService,
    private invoicePdfService: InvoicePdfService
  ){}
  
  ngOnInit(){this.loadLabour();}
  
  onTabChange(tab: string){
    if(tab === 'labour') this.loadLabour();
    else this.loadInsurance();
  }
  
  loadLabour(){this.api.getLabourInvoices().subscribe({next:(d:any[])=>this.labourInvoices=d,error:()=>this.notify.error('Failed')});}
  loadInsurance(){this.api.getInsuranceInvoices().subscribe({next:(d:any[])=>this.insuranceInvoices=d,error:()=>this.notify.error('Failed')});}
  markReady(id:number){this.api.markInvoiceReady(id).subscribe({next:()=>{this.notify.success('Marked ready');this.loadLabour();this.loadInsurance();},error:(e:any)=>this.notify.error(e.error?.message||'Error')});}

  openPdf(event: Event, id: number, jobCardNo: string): void {
    event.preventDefault();
    if (!id) return;
    
    if (environment.newPDFInvoicePrint) {
      const pdfTitle = `${jobCardNo} - Ready for Bill`;
      const pdfWindow = window.open('', '_blank');
      this.api.getInvoicePdfData(id).subscribe({
        next: (res: any) => {
          this.invoicePdfService.generateAndOpenPDF(res.invoice, res.items, pdfWindow, pdfTitle);
        },
        error: (err) => {
          if (pdfWindow) pdfWindow.close();
          console.error(err);
          this.notify.error('Failed to fetch PDF data');
        }
      });
    } else {
      const filename = `${jobCardNo} - invoice`;
      const url = this.api.getInvoicePDFUrl(id, filename);
      window.open(url, '_blank');
    }
  }
}
