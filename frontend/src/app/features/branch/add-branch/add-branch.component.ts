import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-add-branch', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-branch.component.html',
  styleUrls: ['./add-branch.component.css']
})
export class AddBranchComponent {
  form: any = {};
  constructor(private api: ApiService, private notify: NotificationService, private router: Router) {}
  onSubmit() {
    if (!this.form.branch_name) { this.notify.error('Branch name is required'); return; }
    if (!this.form.branch_id) { this.notify.error('Branch ID is required'); return; }
    this.api.createBranch(this.form).subscribe({ 
      next: () => { this.notify.success('Branch created'); this.router.navigate(['/admin/branch/list']); }, 
      error: (e: any) => this.notify.error(e.error?.message || 'Error') 
    });
  }
}
