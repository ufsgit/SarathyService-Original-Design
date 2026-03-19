import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-add-customer', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.css']
})
export class AddCustomerComponent implements OnInit {
  form:any={}; models:any[]=[];
  basePath = '';
  constructor(private api:ApiService,private notify:NotificationService,public auth:AuthService,private router:Router){}
  ngOnInit(){
    this.basePath = this.auth.isAdmin ? '/admin' : '/staff';
    this.api.getModels().subscribe((d:any[])=>this.models=d);
  }
  onSubmit(){
    if(!this.form.c_name||!this.form.c_reg_no||!this.form.c_chassis_no||!this.form.c_engine_no){
      this.notify.error('Name, Reg No, Chassis No, and Engine No are required');
      return;
    }
    if (this.auth.currentUser?.branchId) {
      this.form.c_branch = this.auth.currentUser.branchId;
    }
    this.api.createCustomer(this.form).subscribe({next:()=>{this.notify.success('Created');const base = this.auth.isAdmin ? '/admin' : '/staff';this.router.navigate([`${base}/customer/list`]);},error:(e:any)=>this.notify.error(e.error?.message||'Error')});
  }
}
