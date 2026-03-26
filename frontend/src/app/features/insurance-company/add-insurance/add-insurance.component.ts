import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-add-insurance', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-insurance.component.html',
  styleUrls: ['./add-insurance.component.css']
})
export class AddInsuranceComponent {
  form:any={};
  constructor(private api:ApiService,private notify:NotificationService,private router:Router){}
  onSubmit() {
    if (!this.form.icompany_name) { this.notify.error('Company name is required'); return; }
    if (!this.form.icompany_gst) { this.notify.error('GSTIN is required'); return; }
    if (!this.form.icompany_address) { this.notify.error('Address is required'); return; }
    this.api.createInsuranceCompany(this.form).subscribe({
      next:()=>{this.notify.success('Created');this.router.navigate(['/admin/insurance/list']);},
      error:(e:any)=>this.notify.error(e.error?.message||'Error')
    });
  }
}
