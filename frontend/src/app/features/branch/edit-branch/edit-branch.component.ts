import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LogoService } from '../../../services/logo.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-edit-branch', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-branch.component.html',
  styleUrls: ['./edit-branch.component.css']
})
export class EditBranchComponent implements OnInit {
  form: any = {};
  logos: any[] = [];
  filePath = environment.apiUrl.replace('/api', '');

  constructor(
    private api: ApiService, 
    private notify: NotificationService, 
    private route: ActivatedRoute, 
    private router: Router,
    private logoService: LogoService
  ) {}

  ngOnInit() { 
    this.api.getBranch(+this.route.snapshot.params['id']).subscribe({ 
      next: (d: any) => this.form = d, 
      error: () => this.notify.error('Not found') 
    }); 
    this.logoService.listLogos(1, 100, '').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.logos = res.data;
        }
      }
    });
  }

  onSubmit() { 
    this.api.updateBranch(this.form.b_id, this.form).subscribe({ 
      next: () => { this.notify.success('Updated'); this.router.navigate(['/admin/branch/list']); }, 
      error: (e: any) => this.notify.error(e.error?.message || 'Error') 
    }); 
  }
}
