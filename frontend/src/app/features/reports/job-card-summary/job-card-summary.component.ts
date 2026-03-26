import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-job-card-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, RouterModule, SearchableSelectComponent],
  templateUrl: './job-card-summary.component.html',
  styleUrls: ['./job-card-summary.component.css']
})
export class JobCardSummaryComponent implements OnInit {
  filters: any = {
    from_date: '',
    to_date: '',
    branch: '',
    mechanic: [],
    advisor: [],
    repair_types: [],
    insurance_companies: [],
    service_type: 'Paid Service',
    view_by: 'Custom Date'
  };

  options: any = {
    branches: [],
    mechanics: [],
    advisors: [],
    insuranceCompanies: [],
    repairTypes: []
  };

  branchOptions: string[] = [];
  serviceOptions: string[] = ['Paid Service', 'Free Service', 'Expense'];

  results: any[] = [];
  totals: any = {};
  searched = false;
  isAdmin = false;

  // Pagination
  pageSize = 10;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.results.length / this.pageSize);
  }

  get pagedResults(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.results.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    const range = 2; // pages around current
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - range && i <= current + range)) {
        pages.push(i);
      }
    }
    // insert ellipsis markers (-1)
    const withEllipsis: number[] = [];
    let prev = 0;
    for (const p of pages) {
      if (prev && p - prev > 1) withEllipsis.push(-1);
      withEllipsis.push(p);
      prev = p;
    }
    return withEllipsis;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onPageSizeChange() {
    this.currentPage = 1;
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

  constructor(private api: ApiService, private notify: NotificationService, private router: Router) {}

  ngOnInit() {
    this.isAdmin = this.router.url.includes('/admin/');
    this.loadFilters();
    const today = new Date().toISOString().split('T')[0];
    this.filters.from_date = today;
    this.filters.to_date = today;
  }

  loadFilters() {
    this.api.getFilterOptions().subscribe({
      next: (d: any) => {
        this.options = d;
        this.branchOptions = ['--Select Branch--', ...this.options.branches.map((b: any) => `${b.branch_name}(${b.branch_id})`)];
      },
      error: () => this.notify.error('Failed to load filter options')
    });
  }

  onBranchSelect(label: string) {
    if (!label || label === '--Select Branch--') {
      this.filters.branch = '';
    } else {
      const branch = this.options.branches.find((b: any) => `${b.branch_name}(${b.branch_id})` === label);
      this.filters.branch = branch ? branch.b_id : '';
    }
    this.search();
  }

  onServiceSelect(value: string) {
    this.filters.service_type = value;
    this.search();
  }

  onViewByChange() {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch (this.filters.view_by) {
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
      case 'Custom Date':
        return;
    }

    this.filters.from_date = from.toISOString().split('T')[0];
    this.filters.to_date = to.toISOString().split('T')[0];
    this.search();
  }

  search() {
    if (!this.filters.from_date || !this.filters.to_date) {
      this.notify.error('Please select both From and To dates');
      return;
    }

    this.api.getJobCardSummary(this.filters).subscribe({
      next: (d: any) => {
        this.results = d.data;
        this.totals = d.totals;
        this.searched = true;
        this.currentPage = 1; // reset to first page on new search
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Failed to fetch report data');
      }
    });
  }

  exportExcel() {
    this.exportToExcel(this.results, 'JobCardSummary_All.xls');
  }

  exportCurrentExcel() {
    this.exportToExcel(this.pagedResults, 'JobCardSummary_Visible.xls');
  }

  exportCurrentCSV() {
    this.exportToCSV(this.pagedResults, 'JobCardSummary_Visible.csv');
  }
}
