import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Pipe, PipeTransform } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Pipe({
  name: 'filterBills',
  standalone: true
})
export class FilterBillsPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;
    searchText = searchText.toLowerCase();
    return items.filter(it => {
      return (it.in_registr?.toLowerCase().includes(searchText)) ||
        (it.inv_cus?.toLowerCase().includes(searchText)) ||
        (it.inv_job_card_no?.toString().includes(searchText)) ||
        (it.inv_no?.toLowerCase().includes(searchText));
    });
  }
}

@Component({
  selector: 'app-previous-bills', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FilterBillsPipe],
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
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
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

