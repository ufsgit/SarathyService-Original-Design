import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-edit-employee', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SearchableSelectComponent],
  templateUrl: './edit-employee.component.html',
  styleUrls: ['./edit-employee.component.css']
})
export class EditEmployeeComponent implements OnInit {
  form: any = {}; 
  branches: any[] = [];
  branchNames: string[] = [];
  designations: string[] = ['Mechanic', 'Service Advisor', 'Billing Staff', 'Floor Supervisor'];
  constructor(private api: ApiService, private notify: NotificationService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit() {
    this.api.getBranches().subscribe((d: any[]) => {
      this.branches = d;
      this.branchNames = d.map(b => b.branch_name);
    });
    this.api.getEmployee(+this.route.snapshot.params['id']).subscribe((d: any) => this.form = d);
  }
  onSubmit() { 
    this.api.updateEmployee(this.form.emp_id, this.form).subscribe({ 
      next: () => { this.notify.success('Updated'); this.router.navigate(['/admin/employee/list']); }, 
      error: (e: any) => this.notify.error(e.error?.message || 'Error') 
    }); 
  }
}
