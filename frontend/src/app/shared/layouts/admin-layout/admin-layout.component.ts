import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
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
      '/admin/dashboard': 'Home',
      '/admin/branch/add': 'Master Operations > Branch',
      '/admin/branch/list': 'Master Operations > Branch > List',
      '/admin/labour/add': 'Master Operations > Labour',
      '/admin/labour/list': 'Master Operations > Labour > List',
      '/admin/employee/add': 'Master Operations > Employee',
      '/admin/employee/list': 'Master Operations > Employee > List',
      '/admin/insurance/add': 'Master Operations > Insurance Company',
      '/admin/insurance/list': 'Master Operations > Insurance Company > List',
      '/admin/model/add': 'Master Operations > Vehicle Model',
      '/admin/model/list': 'Master Operations > Vehicle Model > List',
      '/admin/customer/add': 'Customer > Add',
      '/admin/customer/list': 'Customer > List',
      '/admin/invoice/labour': 'INVOICE > Labour',
      '/admin/invoice/insurance': 'INVOICE > Insurance',
      '/admin/invoice/list': 'Invoice > List',
      '/admin/invoice/ready/labour': 'Ready for bill list > Labour',
      '/admin/invoice/ready/insurance': 'Ready for bill list > Insurance',
      '/admin/reports/job-card-summary': 'Reports > Job Card Summary',
      '/admin/reports/job-card-statement': 'Reports > Job Card Statement',
      '/admin/reports/previous-bills/labour': 'Previous Bills > Labour',
      '/admin/reports/previous-bills/insurance': 'Previous Bills > Insurance',
      '/admin/vehicle-history': 'Vehicle History',
      '/admin/change-password': 'My Profile',
    };
    this.breadcrumb = map[url] || 'Home';
  }
}
