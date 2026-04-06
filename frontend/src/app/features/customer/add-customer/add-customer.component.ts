import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
@Component({
  selector: 'app-add-customer', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SearchableSelectComponent],
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.css']
})
export class AddCustomerComponent implements OnInit {
  form:any={}; models:any[]=[]; modelOptions:string[]=[];
  basePath = '';
  constructor(private api:ApiService,private notify:NotificationService,public auth:AuthService,private router:Router){}
  ngOnInit(){
    this.basePath = this.auth.isAdmin ? '/admin' : '/staff';
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
    if(!this.form.c_name||!this.form.c_reg_no||!this.form.c_chassis_no||!this.form.c_engine_no||!this.form.model_name){
      this.notify.error('Customer Name, Reg No, Chassis No, Engine No, and Model Name are required');
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
    this.api.createCustomer(this.form).subscribe({next:()=>{this.notify.success('Created');const base = this.auth.isAdmin ? '/admin' : '/staff';this.router.navigate([`${base}/customer/list`]);},error:(e:any)=>this.notify.error(e.error?.message||'Error')});
  }
}
