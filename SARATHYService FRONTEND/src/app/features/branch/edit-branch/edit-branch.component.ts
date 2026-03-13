import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-edit-branch', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-branch.component.html',
  styleUrls: ['./edit-branch.component.css']
})
export class EditBranchComponent implements OnInit {
  form: any = {};
  constructor(private api: ApiService, private notify: NotificationService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit() { 
    this.api.getBranch(+this.route.snapshot.params['id']).subscribe({ 
      next: (d: any) => this.form = d, 
      error: () => this.notify.error('Not found') 
    }); 
  }
  onSubmit() { 
    this.api.updateBranch(this.form.b_id, this.form).subscribe({ 
      next: () => { this.notify.success('Updated'); this.router.navigate(['/admin/branch/list']); }, 
      error: (e: any) => this.notify.error(e.error?.message || 'Error') 
    }); 
  }
}
