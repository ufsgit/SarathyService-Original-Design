import { Component, OnInit, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-job-card-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, RouterModule],
  templateUrl: './job-card-summary.component.html',
  styleUrls: ['./job-card-summary.component.css']
})
export class JobCardSummaryComponent implements OnInit {
  // Signals for Filters
  fromDate = signal<string>('');
  toDate = signal<string>('');
  branch = signal<string>('');
  serviceType = signal<string>('Paid Service');
  viewBy = signal<string>('Custom Date');
  
  // Multiselect filters (Signals)
  mechanic = signal<any[]>([]);
  advisor = signal<any[]>([]);
  repairTypes = signal<any[]>([]);
  insuranceCompanies = signal<any[]>([]);

  options = signal<any>({
    branches: [],
    mechanics: [],
    advisors: [],
    insuranceCompanies: [],
    repairTypes: []
  });

  results = signal<any[]>([]);
  totals = signal<any>({});
  searched = signal<boolean>(false);
  isAdmin = signal<boolean>(false);
  loading = signal<boolean>(false);

  // Pagination Signals
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);
  totalItems = signal<number>(0);

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  pageNumbersInner = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const range = 2;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - range && i <= current + range)) {
        pages.push(i);
      }
    }
    const withEllipsis: number[] = [];
    let prev = 0;
    for (const p of pages) {
      if (prev && p - prev > 1) withEllipsis.push(-1);
      withEllipsis.push(p);
      prev = p;
    }
    return withEllipsis;
  });

  constructor(private api: ApiService, private notify: NotificationService, private router: Router) {
    // Single consolidated effect for filters and data fetching
    effect(() => {
      // 1. Reactive dependencies
      const view = this.viewBy();
      const fDateRaw = this.fromDate();
      const tDateRaw = this.toDate();
      const br = this.branch();
      const st = this.serviceType();
      const mech = this.mechanic();
      const adv = this.advisor();
      const rt = this.repairTypes();
      const ic = this.insuranceCompanies();
      const pg = this.currentPage();
      const ps = this.pageSize();

      // 2. Handle View By date calculations if not Custom
      let finalFrom = fDateRaw;
      let finalTo = tDateRaw;

      if (view !== 'Custom Date') {
        const today = new Date();
        let from = new Date();
        let to = new Date();

        switch (view) {
          case 'Month to date':
            from = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
          case 'Previous Month':
            from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            to = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
          case 'Year to Date':
            from = new Date(today.getFullYear(), 0, 1);
            break;
          case 'Previous Year':
            from = new Date(today.getFullYear() - 1, 0, 1);
            to = new Date(today.getFullYear() - 1, 11, 31);
            break;
        }
        finalFrom = this.formatDateInternal(from);
        finalTo = this.formatDateInternal(to);

        // Update signals silently if they changed, to keep UI in sync
        untracked(() => {
          if (finalFrom !== this.fromDate()) this.fromDate.set(finalFrom);
          if (finalTo !== this.toDate()) this.toDate.set(finalTo);
          // If the page was not reset yet, reset it when viewBy changes
          // But be careful of infinite loops; only set if it's not 1
          // Actually we only reset page when viewBy itself changes
        });
      }

      // 3. Trigger API call
      if (finalFrom && finalTo) {
        untracked(() => this.search(false));
      }
    }, { allowSignalWrites: true });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  onPageSizeChange(val: number) {
    this.pageSize.set(val);
    this.currentPage.set(1);
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }

  private exportToExcel(data: any[], filename: string) {
    if (!data || data.length === 0) {
      this.notify.error('No data to export');
      return;
    }

    const headers = [
      'JobCard', 'JobCard Date', 'Branch Name', 'Mechanic', 'Advisor',
      'Repair Type', 'Insurance Company', 'Model Name', 'HSN/SAC',
      'Invoice no', 'Invoice Customer', 'Mobile Number', 'Invoice Date',
      'Register No', 'Chassis Number', 'Engine Number', 'KM Reading',
      'Insurance Surveyor', 'Paid Service Amount', 'Free Service Amount',
      'Expense Service Amount', 'Customer GSTN', 'Discount', 'Taxable Amount',
      'SGST/UTGST(9)', 'CGST(9)', 'KFC(1)', 'Invoice Type', 'Invoice Amount'
    ];

    const rows = data.map(r => [
      r.inv_job_card_no || '',
      this.formatDate(r.inv_jcard_date),
      r.branch_name || '',
      r.mechanic_name || '',
      r.advisor_name || '',
      r.inv_repair_typ || '',
      r.icompany_name || '',
      r.inv_modl || '',
      '998729',
      r.inv_no || '',
      r.inv_cus || '',
      r.inv_pho || '',
      this.formatDate(r.inv_inv_date),
      r.in_registr || '',
      r.inv_chassis || '',
      r.in_engine || '',
      r.inv_km || '',
      r.insurance_serveyor || '',
      (r.inv_type === 'Paid Service' || r.inv_type === 'Cash') ? r.inv_total : '0',
      (r.inv_type === 'Free Service' || r.inv_type === 'Free') ? r.inv_total : '0',
      r.inv_type === 'Expense' ? r.inv_total : '0',
      r.inv_cus_gstin || '',
      r.inv_disc_total || '0',
      r.inv_taxtotal || '0',
      r.inv_sgstotal || '0',
      r.inv_gsttotal || '0',
      r.inv_cesstotal || '0',
      r.inv_type || '',
      r.inv_total || '0'
    ]);

    // Create a simple HTML table for Excel
    let html = '<table border="1"><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => html += `<td>${cell}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
      this.notify.error('No data to export');
      return;
    }

    const headers = [
      'JobCard', 'JobCard Date', 'Branch Name', 'Mechanic', 'Advisor',
      'Repair Type', 'Insurance Company', 'Model Name', 'HSN/SAC',
      'Invoice no', 'Invoice Customer', 'Mobile Number', 'Invoice Date',
      'Register No', 'Chassis Number', 'Engine Number', 'KM Reading',
      'Insurance Surveyor', 'Paid Service Amount', 'Free Service Amount',
      'Expense Service Amount', 'Customer GSTN', 'Discount', 'Taxable Amount',
      'SGST/UTGST(9)', 'CGST(9)', 'KFC(1)', 'Invoice Type', 'Invoice Amount'
    ];

    const rows = data.map(r => [
      r.inv_job_card_no || '',
      this.formatDate(r.inv_jcard_date),
      r.branch_name || '',
      r.mechanic_name || '',
      r.advisor_name || '',
      r.inv_repair_typ || '',
      r.icompany_name || '',
      r.inv_modl || '',
      '998729',
      r.inv_no || '',
      r.inv_cus || '',
      r.inv_pho || '',
      this.formatDate(r.inv_inv_date),
      r.in_registr || '',
      r.inv_chassis || '',
      r.in_engine || '',
      r.inv_km || '',
      r.insurance_serveyor || '',
      (r.inv_type === 'Paid Service' || r.inv_type === 'Cash') ? r.inv_total : '0',
      (r.inv_type === 'Free Service' || r.inv_type === 'Free') ? r.inv_total : '0',
      r.inv_type === 'Expense' ? r.inv_total : '0',
      r.inv_cus_gstin || '',
      r.inv_disc_total || '0',
      r.inv_taxtotal || '0',
      r.inv_sgstotal || '0',
      r.inv_gsttotal || '0',
      r.inv_cesstotal || '0',
      r.inv_type || '',
      r.inv_total || '0'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }


  ngOnInit() {
    this.isAdmin.set(this.router.url.includes('/admin/'));
    this.loadFilters();
    
    // Set default dates to today
    const today = new Date();
    const dateStr = this.formatDateInternal(today);
    this.fromDate.set(dateStr);
    this.toDate.set(dateStr);
    // Initial fetch is now handled by the consolidated effect
  }

  private formatDateInternal(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  loadFilters() {
    this.api.getFilterOptions().subscribe({
      next: (d: any) => {
        this.options.set(d);
      },
      error: () => this.notify.error('Failed to load filter options')
    });
  }

  // onViewByChange is no longer needed as the effect handles it
  onViewByChange() {}

  search(resetPage: boolean = true) {
    if (!this.fromDate() || !this.toDate()) {
      return;
    }

    if (resetPage) {
      this.currentPage.set(1);
    }

    const payload = {
      from_date: this.fromDate(),
      to_date: this.toDate(),
      branch: this.branch(),
      mechanic: this.mechanic(),
      advisor: this.advisor(),
      repair_types: this.repairTypes(),
      insurance_companies: this.insuranceCompanies(),
      service_type: this.serviceType(),
      view_by: this.viewBy(),
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.loading.set(true);
    this.api.getJobCardSummary(payload).subscribe({
      next: (d: any) => {
        this.results.set(d.data);
        this.totalItems.set(d.total || 0);
        this.totals.set(d.totals);
        this.searched.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Failed to fetch report data');
        this.loading.set(false);
      }
    });
  }

  exportExcel() {
    const payload = {
      from_date: this.fromDate(),
      to_date: this.toDate(),
      branch: this.branch(),
      mechanic: this.mechanic(),
      advisor: this.advisor(),
      repair_types: this.repairTypes(),
      insurance_companies: this.insuranceCompanies(),
      service_type: this.serviceType(),
      view_by: this.viewBy(),
      page: 1, 
      pageSize: 1000000 
    };
    this.api.getJobCardSummary(payload).subscribe({
      next: (d: any) => {
        this.exportToExcel(d.data, 'JobCardSummary_All.xls');
      },
      error: () => this.notify.error('Failed to fetch data for export')
    });
  }

  exportCurrentExcel() {
    this.exportToExcel(this.results(), 'JobCardSummary_Visible.xls');
  }

  exportCurrentCSV() {
    this.exportToCSV(this.results(), 'JobCardSummary_Visible.csv');
  }

  trackByInvId(index: number, item: any): number {
    return item.inv_id;
  }
}
