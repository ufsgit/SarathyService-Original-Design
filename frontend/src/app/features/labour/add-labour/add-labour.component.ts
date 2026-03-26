import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-add-labour', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SearchableSelectComponent],
  templateUrl: './add-labour.component.html',
  styleUrls: ['./add-labour.component.css']
})
export class AddLabourComponent {
  repairTypes: string[] = ['Paid Service', 'Free Service', 'Accident', 'Warranty'];
  form: any = {
    l_repair_type: 'Paid Service'
  };
  constructor(private api: ApiService, private notify: NotificationService, private router: Router) {}
  onSubmit() {
    if (!this.form.l_name) { this.notify.error('Labour name required'); return; }
    this.api.createLabour(this.form).subscribe({ 
      next: () => { this.notify.success('Created'); this.router.navigate(['/admin/labour/list']); }, 
      error: (e:any) => this.notify.error(e.error?.message||'Error') 
    });
  }
}
