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

  onSubmit() {
    if (!this.form.c_name || !this.form.c_reg_no || !this.form.c_chassis_no || !this.form.c_engine_no) {
      this.notify.error('Name, Reg No, Chassis No, and Engine No are required');
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
