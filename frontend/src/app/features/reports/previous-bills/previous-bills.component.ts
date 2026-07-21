import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-previous-bills', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './previous-bills.component.html',
  styleUrls: ['./previous-bills.component.css']
})
export class PreviousBillsComponent implements OnInit {
  bills = signal<any[]>([]); 
  isLoading = signal<boolean>(false);
  type = 'labour'; searchText = '';
  isSearchPending = false;
  isAdmin = false;
  Math = Math;
  
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  constructor(public api: ApiService, private notify: NotificationService, private route: ActivatedRoute, private router: Router, private auth: AuthService) { 
  }
  ngOnInit() {
    this.isAdmin = this.router.url.includes('/admin/');
    this.type = this.route.snapshot.data['type'] || 'labour';
    this.fetchBills();
  }

  fetchBills(): void {
    this.isLoading.set(true);

    const params: any = {
      page: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchText
    };

    const user = this.auth.currentUser;
    if (user && user.role === 'staff' && user.branchId) {
      params['branchId'] = user.branchId;
    }

    const obs = this.type === 'labour' 
      ? this.api.getPreviousLabourBills(params)
      : this.api.getPreviousInsuranceBills(params);

    obs.subscribe({
      next: (res: any) => {
        this.bills.set(res.data || []);
        this.totalItems = res.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.isLoading.set(false);
      },
      error: () => {
        this.notify.error('Failed to load bills');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetchBills();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.fetchBills();
  }

  onSearch(): void {
    this.isSearchPending = false;
    this.currentPage = 1;
    this.fetchBills();
  }

  markPending(): void {
    this.isSearchPending = true;
  }

  getPageArray(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1); pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1); pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); pages.push(total);
      }
    }
    return pages;
  }

  openPdf(bill: any): void {
    console.log("openPdf:",bill);
    if (!bill?.inv_id) return;
    const filename = `${bill.inv_job_card_no} - previous bill ${this.type}`;
    const url = this.api.getInvoicePDFUrl(bill.inv_id, filename);
    // Append auth token so the protected PDF endpoint can verify the request
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const cb = Date.now();
    const pdfUrl = token ? `${url}?token=${encodeURIComponent(token)}&cb=${cb}` : `${url}?cb=${cb}`;
    window.open(pdfUrl, '_blank');
  }
}
