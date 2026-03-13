import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

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

  cols = [
    'Serial No', 'Customer Name', 'Customer Address', 'Registration Number',
    'Chassis Number', 'Engine Number', 'Model Name', 'Contact Number',
    'GSTIN No', 'Date of Sale', 'Email Id', 'Action'
  ];

  basePath = '';
  constructor(private api: ApiService, private notify: NotificationService, public auth: AuthService) {}

  ngOnInit() {
    this.basePath = this.auth.isAdmin ? '/admin' : '/staff';
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getCustomers().subscribe({
      next: (d: any[]) => {
        this.customers = d;
        this.filtered = d;
        this.loading = false;
      },
      error: () => {
        this.notify.error('Failed to load customers');
        this.loading = false;
      }
    });
  }

  applyFilter() {
    const s = this.searchTerm.toLowerCase();
    this.filtered = this.customers.filter(c =>
      (c.c_name || '').toLowerCase().includes(s) ||
      (c.c_reg_no || '').toLowerCase().includes(s) ||
      (c.c_contact_no || '').includes(s) ||
      (c.model_name || '').toLowerCase().includes(s)
    );
    this.currentPage = 1; // Reset to first page on filter
  }

  get paginatedCustomers() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filtered.length / this.pageSize);
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
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
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

