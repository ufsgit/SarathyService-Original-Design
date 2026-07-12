import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-list-customer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-customer.component.html',
  styleUrls: ['./list-customer.component.css']
})
export class ListCustomerComponent implements OnInit {
  customers: any[] = [];
  filtered: any[] = [];
  searchTerm = '';
  loading = false;
  Math = Math;
  
  // Pagination

  pageSize = 10;
  currentPage = 1;
  totalItems = 0;

  private searchSubject = new Subject<string>();

  cols = [
    'Serial No', 'Customer Name', 'Customer Address', 'Registration Number',
    'Chassis Number', 'Engine Number', 'Model Name', 'Contact Number',
    'GSTIN No', 'Date of Sale', 'Email Id', 'Action'
  ];

  basePath = '';
  constructor(private api: ApiService, private notify: NotificationService, public auth: AuthService) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.load();
    });
  }

  ngOnInit() {
    this.basePath = this.auth.isAdmin ? '/admin' : '/staff';
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getPaginatedCustomers(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (res: any) => {
        this.customers = res.data || [];
        this.totalItems = res.total || 0;
        this.loading = false;
      },
      error: () => {
        this.notify.error('Failed to load customers');
        this.loading = false;
      }
    });
  }

  applyFilter() {
    this.searchSubject.next(this.searchTerm);
  }

  get paginatedCustomers() {
    return this.customers;
  }

  get totalPages() {
    return Math.ceil(this.totalItems / this.pageSize) || 0;
  }

  get pages() {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    
    const pages: any[] = [];
    const current = this.currentPage;

    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.load();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.load();
  }

  del(id: number) {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.api.deleteCustomer(id).subscribe({
        next: () => {
          this.notify.success('Customer deleted');
          this.load();
        },
        error: (e: any) => this.notify.error(e.error?.message || 'Error deleting customer')
      });
    }
  }
}

