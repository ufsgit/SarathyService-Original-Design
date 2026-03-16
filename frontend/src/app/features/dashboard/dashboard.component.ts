import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: any[] = [];
  constructor(public auth: AuthService, private api: ApiService) {}
  ngOnInit() {
    this.stats = [
      { icon: '🏠', label: 'Branches', value: '...' },
      { icon: '👥', label: 'Employees', value: '...' },
      { icon: '👤', label: 'Customers', value: '...' },
      { icon: '📄', label: 'Invoices', value: '...' },
    ];
    this.api.getBranches().subscribe({ next: d => this.stats[0].value = d.length, error: () => this.stats[0].value = 0 });
    this.api.getEmployees().subscribe({ next: d => this.stats[1].value = d.length, error: () => this.stats[1].value = 0 });
    this.api.getCustomers().subscribe({ next: d => this.stats[2].value = d.length, error: () => this.stats[2].value = 0 });
    this.api.getLabourInvoices().subscribe({ next: d => this.stats[3].value = d.length, error: () => this.stats[3].value = 0 });
  }
}
