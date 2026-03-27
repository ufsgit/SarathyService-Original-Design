import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ready-bills', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ready-bills.component.html',
  styleUrls: ['./ready-bills.component.css']
})
export class ReadyBillsComponent implements OnInit {
  bills = signal<any[]>([]);
  type = signal<string>('labour');
  searchText = signal<string>('');
  totalItems = signal<number>(0);
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  loading = signal<boolean>(false);

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  pageNumbersInner = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
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
  });

  constructor(public api: ApiService, private notify: NotificationService, private route: ActivatedRoute, private auth: AuthService) {
    // Re-fetch data whenever page, pageSize or search changes
    effect(() => {
      this.loadBills();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Watch for route data changes (labour vs insurance)
    this.route.data.subscribe(data => {
      const newType = data['type'] || 'labour';
      // Only set if different to avoid redundant effect runs
      if (this.type() !== newType) {
        this.type.set(newType);
        this.currentPage.set(1);
      }
    });
  }

  loadBills() {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchText()
    };

    const user = this.auth.currentUser;
    if (user && user.role === 'staff' && user.branchId) {
      params['branchId'] = user.branchId;
    }

    const apiCall = this.type() === 'labour' ? 
      this.api.getReadyLabourBills(params) : 
      this.api.getReadyInsuranceBills(params);

    apiCall.subscribe({
      next: (d: any) => {
        this.bills.set(d.data);
        this.totalItems.set(d.total || 0);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Failed to load bills');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(val: string) {
    this.searchText.set(val);
    this.currentPage.set(1);
  }

  onPageSizeChange(val: number) {
    this.pageSize.set(val);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }
}
