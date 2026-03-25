import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-list-employee', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-employee.component.html',
  styleUrls: ['./list-employee.component.css']
})
export class ListEmployeeComponent implements OnInit {
  employees: any[] = [];
  showStatusModal = false;
  selectedEmployee: any = null;
  statusToUpdate = 'active';

  constructor(private api: ApiService, private notify: NotificationService, public auth: AuthService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getEmployees().subscribe({ next: (d: any[]) => this.employees = d, error: () => this.notify.error('Failed') }); }
  
  openStatusModal(employee: any) {
    this.selectedEmployee = employee;
    this.statusToUpdate = employee.status === 'active' || employee.status == 1 ? 'active' : 'inactive';
    this.showStatusModal = true;
  }

  closeStatusModal() {
    this.showStatusModal = false;
    this.selectedEmployee = null;
  }

  updateStatus() {
    if (!this.selectedEmployee) return;
    const statusValue = this.statusToUpdate;
    this.api.updateEmployeeStatus(this.selectedEmployee.emp_id, statusValue).subscribe({
      next: () => {
        this.notify.success('Status updated');
        this.closeStatusModal();
        this.load();
      },
      error: (e: any) => this.notify.error(e.error?.message || 'Error updating status')
    });
  }

  del(id: number) { 
    if (confirm('Delete?')) this.api.deleteEmployee(id).subscribe({ next: () => { this.notify.success('Deleted'); this.load(); }, error: (e: any) => this.notify.error(e.error?.message || 'Error') }); 
  }
}

