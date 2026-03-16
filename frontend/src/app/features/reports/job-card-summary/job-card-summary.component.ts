import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-job-card-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule],
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

  results: any[] = [];
  totals: any = {};
  searched = false;

  constructor(private api: ApiService, private notify: NotificationService) {}

  ngOnInit() {
    this.loadFilters();
    const today = new Date().toISOString().split('T')[0];
    this.filters.from_date = today;
    this.filters.to_date = today;
  }

  loadFilters() {
    this.api.getFilterOptions().subscribe({
      next: (d: any) => {
        this.options = d;
      },
      error: () => this.notify.error('Failed to load filter options')
    });
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
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Failed to fetch report data');
      }
    });
  }

  exportExcel() {
    // Logic for excel export could be added here
    this.notify.info('Excel export functionality coming soon');
  }
}
