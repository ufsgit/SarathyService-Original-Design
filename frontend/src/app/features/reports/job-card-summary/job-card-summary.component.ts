import { Component, OnInit, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { MatMultiSearchSelectComponent } from '../../../shared/components/mat-multi-search-select/mat-multi-search-select.component';

@Component({
  selector: 'app-job-card-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, RouterModule, SearchableSelectComponent, MatMultiSearchSelectComponent],
  templateUrl: './job-card-summary.component.html',
  styleUrls: ['./job-card-summary.component.css']
})
export class JobCardSummaryComponent implements OnInit {
  // Signals for Filters
  fromDate = signal<string>('');
  toDate = signal<string>('');
  branch = signal<number[]>([]);
  serviceType = signal<string>('ALL');
  viewBy = signal<string>('Custom Date');
  isSearchPending = signal<boolean>(false);
  
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

  filters = {
    branch_label: '',
    service_type: 'ALL'
  };

  branchOptions: string[] = [];
  serviceOptions: string[] = ['ALL', 'Paid Service', 'Free Service', 'Expense'];

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

  today = new Date().toISOString().split('T')[0];

  constructor(private api: ApiService, private notify: NotificationService, private router: Router) {
    effect(() => {
      const view = this.viewBy();

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
        const finalFrom = this.formatDateInternal(from);
        const finalTo = this.formatDateInternal(to);

        untracked(() => {
          if (finalFrom !== this.fromDate()) this.fromDate.set(finalFrom);
          if (finalTo !== this.toDate()) this.toDate.set(finalTo);
        });
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const pg = this.currentPage();
      const ps = this.pageSize();

      untracked(() => {
        if (this.searched() && this.fromDate() && this.toDate()) {
          this.search(false);
        }
      });
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
      if (isNaN(d.getTime())) return dateStr.split('T')[0];
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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
      'SGST/UTGST(9)', 'CGST(9)', 'Invoice Type', 'Invoice Amount'
    ];

    const rows: any[][] = data.map(r => [
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
      r.inv_type || '',
      r.inv_total || '0'
    ]);

    let totalSgst = 0, totalCgst = 0, totalTaxable = 0, totalDiscount = 0, totalInvoice = 0, totalExpense = 0, totalFree = 0, totalPaid = 0;
    data.forEach(r => {
      totalSgst += +(r.inv_sgstotal || 0);
      totalCgst += +(r.inv_gsttotal || 0);
      totalTaxable += +(r.inv_taxtotal || 0);
      totalDiscount += +(r.inv_disc_total || 0);
      totalInvoice += +(r.inv_total || 0);
      const type = r.inv_type || '';
      const total = +(r.inv_total || 0);
      if (type === 'Paid Service' || type === 'Cash') totalPaid += total;
      else if (type === 'Free Service' || type === 'Free') totalFree += total;
      else if (type === 'Expense') totalExpense += total;
    });

    const summaryRow = new Array(headers.length).fill('');
    summaryRow[0] = `No.of JobCard: ${data.length}`;
    summaryRow[18] = totalPaid.toFixed(2);
    summaryRow[19] = totalFree.toFixed(2);
    summaryRow[20] = totalExpense.toFixed(2);
    summaryRow[22] = totalDiscount.toFixed(2);
    summaryRow[23] = totalTaxable.toFixed(2);
    summaryRow[24] = totalSgst.toFixed(2);
    summaryRow[25] = totalCgst.toFixed(2);
    summaryRow[27] = totalInvoice.toFixed(2);
    
    rows.push([]);
    rows.push(summaryRow);


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
      'SGST/UTGST(9)', 'CGST(9)', 'Invoice Type', 'Invoice Amount'
    ];

    const rows: any[][] = data.map(r => [
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
      r.inv_type || '',
      r.inv_total || '0'
    ]);

    let totalSgst = 0, totalCgst = 0, totalTaxable = 0, totalDiscount = 0, totalInvoice = 0, totalExpense = 0, totalFree = 0, totalPaid = 0;
    data.forEach(r => {
      totalSgst += +(r.inv_sgstotal || 0);
      totalCgst += +(r.inv_gsttotal || 0);
      totalTaxable += +(r.inv_taxtotal || 0);
      totalDiscount += +(r.inv_disc_total || 0);
      totalInvoice += +(r.inv_total || 0);
      const type = r.inv_type || '';
      const total = +(r.inv_total || 0);
      if (type === 'Paid Service' || type === 'Cash') totalPaid += total;
      else if (type === 'Free Service' || type === 'Free') totalFree += total;
      else if (type === 'Expense') totalExpense += total;
    });

    const summaryRow = new Array(headers.length).fill('');
    summaryRow[0] = `No.of JobCard: ${data.length}`;
    summaryRow[18] = totalPaid.toFixed(2);
    summaryRow[19] = totalFree.toFixed(2);
    summaryRow[20] = totalExpense.toFixed(2);
    summaryRow[22] = totalDiscount.toFixed(2);
    summaryRow[23] = totalTaxable.toFixed(2);
    summaryRow[24] = totalSgst.toFixed(2);
    summaryRow[25] = totalCgst.toFixed(2);
    summaryRow[27] = totalInvoice.toFixed(2);
    
    rows.push([]);
    rows.push(summaryRow);


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
        this.branchOptions = ['--Select Branch--', ...this.options().branches.map((b: any) => `${b.branch_name}(${b.branch_id})`)];
        
        if (!this.isAdmin()) {
          try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
              const user = JSON.parse(userStr);
              if (user.branchId || user.branchName || user.e_branch || user.branch) {
                const searchStr1 = String(user.branchId || '').trim().toLowerCase();
                const searchStr2 = String(user.branchName || user.e_branch || user.branch || '').trim().toLowerCase();
                
                const b = this.options().branches.find((br: any) => {
                  const brId = String(br.b_id).toLowerCase();
                  const brStrId = String(br.branch_id || '').toLowerCase();
                  const brName = String(br.branch_name || '').toLowerCase();
                  
                  return (searchStr1 && (brId === searchStr1 || brStrId === searchStr1 || brName === searchStr1)) ||
                         (searchStr2 && (brId === searchStr2 || brStrId === searchStr2 || brName === searchStr2));
                });
                
                if (b) {
                  this.filters.branch_label = `${b.branch_name}(${b.branch_id})`;
                  this.branch.set([b.b_id]);
                } else if (searchStr2 || searchStr1) {
                  // Fallback: just show the string if we couldn't map it properly to backend list
                  this.filters.branch_label = user.branchName || user.e_branch || user.branch || user.branchId;
                }
              }
            }
          } catch(e) {}
        }
        
        // Automatically load initial data
        this.search(true);
      },
      error: () => this.notify.error('Failed to load filter options')
    });
  }

  onBranchSelect(label: string) {
    if (!label || label === '--Select Branch--') {
      this.branch.set([]);
    } else {
      const branch = this.options().branches.find((b: any) => `${b.branch_name}(${b.branch_id})` === label);
      this.branch.set(branch ? [branch.b_id] : []);
    }
  }

  onServiceSelect(value: string) {
    this.serviceType.set(value);
  }


  markPending() {
    this.isSearchPending.set(true);
  }

  // onViewByChange is no longer needed as the effect handles it
  onViewByChange() {}

  search(resetPage: boolean = true) {
    this.isSearchPending.set(false);
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

  getSelectedLabel(ids: any[], type: 'mechanics' | 'advisors' | 'insuranceCompanies' | 'repairTypes' | 'branches'): string {
    if (!ids || ids.length === 0) return '';
    if (ids.length > 1) return `${ids.length} Selected`;
    
    // For single selection
    const id = ids[0];
    const opts = this.options();
    switch (type) {
      case 'mechanics':
        const m = opts.mechanics.find((x: any) => x.emp_id === id);
        return m ? `${m.e_first_name} [${m.e_code}]` : id;
      case 'advisors':
        const a = opts.advisors.find((x: any) => x.emp_id === id);
        return a ? `${a.e_first_name} [${a.e_code}]` : id;
      case 'repairTypes':
        return id;
      case 'insuranceCompanies':
        const c = opts.insuranceCompanies.find((x: any) => x.com_id === id);
        return c ? c.icompany_name : id;
      case 'branches':
        const b = opts.branches.find((x: any) => x.b_id === id);
        return b ? b.branch_name : id;
      default:
        return id;
    }
  }

  trackByInvId(index: number, item: any): number {
    return item.inv_id;
  }
}
