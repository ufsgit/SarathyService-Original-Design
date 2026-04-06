import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-add-customer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-customer-modal.component.html',
  styleUrls: ['./add-customer-modal.component.css']
})
export class AddCustomerModalComponent implements OnInit {
  @Input() registrationNumber: string = '';
  @Output() customerAdded = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  form: any = {};
  models: any[] = [];

  constructor(private api: ApiService, private notify: NotificationService) {}

  ngOnInit() {
    this.form.c_reg_no = this.registrationNumber;
    this.api.getModels().subscribe((d: any[]) => this.models = d);
  }

  sanitizeContactNo() {
    this.form.c_contact_no = (this.form.c_contact_no || '').replace(/\D/g, '').slice(0, 10);
  }

  onContactInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = (input.value || '').replace(/\D/g, '').slice(0, 10);
    input.value = sanitizedValue;
    this.form.c_contact_no = sanitizedValue;
  }

  blockNonNumericKey(event: KeyboardEvent) {
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

  blockNonNumericPaste(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^\d*$/.test(pastedText)) {
      event.preventDefault();
    }
  }

  sanitizeGstinNo() {
    this.form.gstin_no = (this.form.gstin_no || '').replace(/[^0-9a-z]/gi, '').slice(0, 15).toUpperCase();
  }

  onSubmit() {
    if (!this.form.c_name || !this.form.c_reg_no || !this.form.c_chassis_no || !this.form.c_engine_no) {
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

    this.api.createCustomer(this.form).subscribe({
      next: (res: any) => {
        this.notify.success('Customer added successfully');
        // Fetch the newly created customer to return full details
        this.api.getCustomer(res.id).subscribe(customer => {
          this.customerAdded.emit(customer);
        });
      },
      error: (e: any) => this.notify.error(e.error?.message || 'Error adding customer')
    });
  }

  onCancel() {
    this.close.emit();
  }
}
