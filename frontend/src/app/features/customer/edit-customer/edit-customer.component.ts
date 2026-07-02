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
      if (this.form.c_sales_date) {
        const d = new Date(this.form.c_sales_date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        this.form.c_sales_date = `${year}-${month}-${day}`;
      }
    });
    this.api.getModels().subscribe((d:any[])=>{
      this.models=d;
      this.modelOptions = d.map(m => m.mod_name);
    });
  }
  sanitizeContactNo(){
    this.form.c_contact_no = (this.form.c_contact_no || '').replace(/\D/g, '').slice(0, 10);
  }
  onContactInput(event: Event){
    const input = event.target as HTMLInputElement;
    const sanitizedValue = (input.value || '').replace(/\D/g, '').slice(0, 10);
    input.value = sanitizedValue;
    this.form.c_contact_no = sanitizedValue;
  }
  blockNonNumericKey(event: KeyboardEvent){
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }
  blockNonNumericPaste(event: ClipboardEvent){
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^\d*$/.test(pastedText)) {
      event.preventDefault();
    }
  }
  sanitizeGstinNo(){
    this.form.gstin_no = (this.form.gstin_no || '').replace(/[^0-9a-z]/gi, '').slice(0, 15).toUpperCase();
  }
  onSubmit(){
    if(!this.form.c_name||!this.form.c_reg_no||!this.form.c_chassis_no||!this.form.c_engine_no){
      this.notify.error('Name, Reg No, Chassis No, and Engine No are required');
      return;
    }
    this.sanitizeContactNo();
    this.sanitizeGstinNo();
    if (this.form.c_contact_no && this.form.c_contact_no.length !== 10) {
      this.notify.error('Contact number must be exactly 10 digits');
      return;
    }
    if (this.form.gstin_no && this.form.gstin_no.length > 15) {
      this.notify.error('GSTIN must not exceed 15 characters');
      return;
    }
    if (this.auth.isStaff && this.auth.currentUser?.branchId) {
      this.form.c_branch = this.auth.currentUser.branchId;
    }
    this.api.updateCustomer(this.form.c_id,this.form).subscribe({next:()=>{this.notify.success('Updated');const base = this.auth.isAdmin ? '/admin' : '/staff';this.router.navigate([`${base}/customer/list`]);},error:(e:any)=>this.notify.error(e.error?.message||'Error')});
  }
}
