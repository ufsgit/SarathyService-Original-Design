import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


@Component({
  selector: 'app-previous-bills', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './previous-bills.component.html',
  styleUrls: ['./previous-bills.component.css']
})
export class PreviousBillsComponent implements OnInit {
  bills: any[] = []; type = 'labour'; searchText = '';
  isAdmin = false;
  Math = Math;
  
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  private searchSubject = new Subject<string>();

  constructor(public api: ApiService, private notify: NotificationService, private route: ActivatedRoute, private router: Router) { 
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.fetchBills();
    });
  }
  ngOnInit() {
    this.isAdmin = this.router.url.includes('/admin/');
    this.type = this.route.snapshot.data['type'] || 'labour';
    this.fetchBills();
  }

  fetchBills(): void {
    const obs = this.type === 'labour' 
      ? this.api.getPreviousLabourBills(this.currentPage, this.pageSize, this.searchText)
      : this.api.getPreviousInsuranceBills(this.currentPage, this.pageSize, this.searchText);

    obs.subscribe({
      next: (res: any) => {
        this.bills = res.data;
        this.totalItems = res.total;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      },
      error: () => this.notify.error('Failed to load bills')
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
    this.searchSubject.next(this.searchText);
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
    if (!bill?.inv_id) return;
    const url = this.api.getInvoicePDFUrl(bill.inv_id);
    // Append auth token so the protected PDF endpoint can verify the request
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const pdfUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
    window.open(pdfUrl, '_blank');
  }
}

