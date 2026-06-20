import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LogoService } from '../../../services/logo.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-add-branch', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-branch.component.html',
  styleUrls: ['./add-branch.component.css']
})
export class AddBranchComponent implements OnInit {
  form: any = {};
  logos: any[] = [];
  filePath = environment.apiUrl.replace('/api', '');

  constructor(
    private api: ApiService, 
    private notify: NotificationService, 
    private router: Router,
    private logoService: LogoService
  ) {}

  ngOnInit() {
    this.logoService.listLogos(1, 100, '').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.logos = res.data;
        }
      }
    });
  }

  onSubmit() {
    if (!this.form.branch_name) { this.notify.error('Branch name is required'); return; }
    if (!this.form.branch_id) { this.notify.error('Branch ID is required'); return; }
    // Convert empty string logo to null/undefined if necessary, or just let backend handle
    this.api.createBranch(this.form).subscribe({ 
      next: () => { this.notify.success('Branch created'); this.router.navigate(['/admin/branch/list']); }, 
      error: (e: any) => this.notify.error(e.error?.message || 'Error') 
    });
  }
}
