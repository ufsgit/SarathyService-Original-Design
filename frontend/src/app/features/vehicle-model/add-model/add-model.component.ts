import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-add-model', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-model.component.html',
  styleUrls: ['./add-model.component.css']
})
export class AddModelComponent {
  form:any={};
  constructor(private api:ApiService,private notify:NotificationService,private router:Router){}
  onSubmit() {
    if (!this.form.mod_name) { this.notify.error('Model name is required'); return; }
    if (!this.form.mod_code) { this.notify.error('Model code is required'); return; }
    this.api.createModel(this.form).subscribe({
      next:()=>{this.notify.success('Created');this.router.navigate(['/admin/model/list']);},
      error:(e:any)=>this.notify.error(e.error?.message||'Error')
    });
  }
}
