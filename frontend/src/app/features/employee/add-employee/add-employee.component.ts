import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-add-employee', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SearchableSelectComponent],
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.css']
})
export class AddEmployeeComponent implements OnInit {
  form: any = {
    add_as_user: false
  };
  branches: any[] = [];
  branchNames: string[] = [];
  titles: string[] = ['Mr.', 'Ms.'];
  designations: string[] = ['Mechanic', 'Service Advisor', 'Billing Staff', 'Floor Supervisor'];

  constructor(private api: ApiService, private notify: NotificationService, private router: Router) {}
  ngOnInit() { 
    this.api.getBranches().subscribe((d: any[]) => {
      this.branches = d;
      this.branchNames = d.map(b => b.branch_name);
    }); 
  }
  onSubmit() {
    if (!this.form.e_first_name) { this.notify.error('Name required'); return; }
    
    // Process login credentials only if add_as_user is true
    const submissionData = { ...this.form };
    if (!this.form.add_as_user) {
      delete submissionData.login_id;
      delete submissionData.login_password;
    }

    this.api.createEmployee(submissionData).subscribe({ 
      next: () => { this.notify.success('Created'); this.router.navigate(['/admin/employee/list']); }, 
      error: (e: any) => this.notify.error(e.error?.message || 'Error') 
    });
  }
}

