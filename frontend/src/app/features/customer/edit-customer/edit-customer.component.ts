import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
@Component({
  selector: 'app-edit-customer', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SearchableSelectComponent],
  templateUrl: './edit-customer.component.html',
  styleUrls: ['./edit-customer.component.css']
})
export class EditCustomerComponent implements OnInit {
  form:any={}; models:any[]=[]; modelOptions:string[]=[];
  constructor(private api:ApiService,private notify:NotificationService,private route:ActivatedRoute,private router:Router, public auth: AuthService){}
  ngOnInit(){
    const id=+this.route.snapshot.params['id'];
    this.api.getCustomer(id).subscribe((d:any)=>{
      this.form=d; 
      if(this.form.c_sales_date) this.form.c_sales_date=this.form.c_sales_date.split('T')[0];
    });
    this.api.getModels().subscribe((d:any[])=>{
      this.models=d;
      this.modelOptions = d.map(m => m.mod_name);
    });
  }
  onSubmit(){
    if(!this.form.c_name||!this.form.c_reg_no||!this.form.c_chassis_no||!this.form.c_engine_no){
      this.notify.error('Name, Reg No, Chassis No, and Engine No are required');
      return;
    }
    if (this.auth.isStaff && this.auth.currentUser?.branchId) {
      this.form.c_branch = this.auth.currentUser.branchId;
    }
    this.api.updateCustomer(this.form.c_id,this.form).subscribe({next:()=>{this.notify.success('Updated');const base = this.auth.isAdmin ? '/admin' : '/staff';this.router.navigate([`${base}/customer/list`]);},error:(e:any)=>this.notify.error(e.error?.message||'Error')});
  }
}
