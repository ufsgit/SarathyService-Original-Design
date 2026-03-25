import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-add-employee', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.css']
})
export class AddEmployeeComponent implements OnInit {
  form: any = {
    add_as_user: false
  };
  branches: any[] = [];
  titles: string[] = ['Mr.', 'Ms.'];
  designations: string[] = ['Mechanic', 'Service Advisor', 'Billing Staff', 'Floor Supervisor'];

  constructor(private api: ApiService, private notify: NotificationService, private router: Router) {}
  ngOnInit() { this.api.getBranches().subscribe((d: any[]) => this.branches = d); }
  onSubmit() {
    if (!this.form.e_first_name) { this.notify.error('Name is required'); return; }
    if (!this.form.e_branch) { this.notify.error('Branch Name is required'); return; }
    if (!this.form.e_code) { this.notify.error('Employee Code is required'); return; }
    if (!this.form.e_designation) { this.notify.error('Employee Designation is required'); return; }
    if (!this.form.login_id) { this.notify.error('Username is required'); return; }
    if (!this.form.login_password) { this.notify.error('Password is required'); return; }
    
    // The user wants these required, so we force add_as_user to true effectively
    const submissionData = { ...this.form, add_as_user: true };

    this.api.createEmployee(submissionData).subscribe({ 
      next: () => { this.notify.success('Created'); this.router.navigate(['/admin/employee/list']); }, 
      error: (e: any) => this.notify.error(e.error?.message || 'Error') 
    });
  }
}

