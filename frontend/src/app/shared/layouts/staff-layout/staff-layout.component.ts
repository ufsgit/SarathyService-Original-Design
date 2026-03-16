import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './staff-layout.component.html',
  styleUrls: ['./staff-layout.component.css']
})
export class StaffLayoutComponent implements OnInit {
  breadcrumb = 'Home';

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateBreadcrumb(event.urlAfterRedirects || event.url);
    });
    this.updateBreadcrumb(this.router.url);
  }

  private updateBreadcrumb(url: string) {
    const map: Record<string, string> = {
      '/staff/dashboard': 'Home',
      '/staff/customer/add': 'Customer > Add',
      '/staff/customer/list': 'Customer > List',
      '/staff/invoice/labour': 'INVOICE > Labour',
      '/staff/invoice/insurance': 'INVOICE > Insurance',
      '/staff/invoice/ready/labour': 'Ready for bill list > Labour',
      '/staff/invoice/ready/insurance': 'Ready for bill list > Insurance',
      '/staff/reports/job-card-summary': 'Reports > Job Card Summary',
      '/staff/reports/job-card-statement': 'Reports > Job Card Statement',
      '/staff/reports/previous-bills/labour': 'Previous Bills > Labour',
      '/staff/reports/previous-bills/insurance': 'Previous Bills > Insurance',
      '/staff/vehicle-history': 'Vehicle History',
      '/staff/change-password': 'My Profile',
    };
    this.breadcrumb = map[url] || 'Home';
  }
}
