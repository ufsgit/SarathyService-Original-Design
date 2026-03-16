import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-edit-employee', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-employee.component.html',
  styleUrls: ['./edit-employee.component.css']
})
export class EditEmployeeComponent implements OnInit {
  form: any = {}; branches: any[] = [];
  constructor(private api: ApiService, private notify: NotificationService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit() {
    this.api.getBranches().subscribe((d: any[]) => this.branches = d);
    this.api.getEmployee(+this.route.snapshot.params['id']).subscribe((d: any) => this.form = d);
  }
  onSubmit() { 
    this.api.updateEmployee(this.form.emp_id, this.form).subscribe({ 
      next: () => { this.notify.success('Updated'); this.router.navigate(['/admin/employee/list']); }, 
      error: (e: any) => this.notify.error(e.error?.message || 'Error') 
    }); 
  }
}
