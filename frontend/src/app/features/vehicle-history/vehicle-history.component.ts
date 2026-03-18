import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-vehicle-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-history.component.html',
  styleUrls: ['./vehicle-history.component.css']
})
export class VehicleHistoryComponent {

  regNo = '';
  customer: any = null;
  invoices: any[] = [];
  searched = false;

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  search() {
    if (!this.regNo) {
      this.notify.error('Enter registration number');
      return;
    }

    // Step 1: Check if vehicle exists first to give immediate feedback
    this.api.searchVehicleHistory(this.regNo).subscribe({
      next: (d: any) => {
        if (!d.customer) {
          this.notify.error('No vehicle found for this registration number');
          return;
        }
        
        this.customer = d.customer;
        this.invoices = d.invoices;
        this.searched = true;

        // Step 2: Open the High-Fidelity PDF in a new tab
        this.openPdf();
      },
      error: () => this.notify.error('Failed to fetch vehicle history')
    });
  }

  openPdf() {
    const baseUrl = this.api.getVehicleHistoryPDFUrl(this.regNo);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    
    // Append token for authentication in the new tab
    const pdfUrl = token ? `${baseUrl}&token=${encodeURIComponent(token)}` : baseUrl;
    
    window.open(pdfUrl, '_blank');
  }
}