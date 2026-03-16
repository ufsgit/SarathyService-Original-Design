import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-dashboard.component.html',
styleUrls: ['./staff-dashboard.component.css']
})
export class StaffDashboardComponent {
  constructor(public auth: AuthService) {}
}
