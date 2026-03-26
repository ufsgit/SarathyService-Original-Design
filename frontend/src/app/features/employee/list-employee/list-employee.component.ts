import { Component, OnInit, signal, effect, untracked } from '@angular/core';
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
  employees = signal<any[]>([]);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalItems = signal<number>(0);

  showStatusModal = false;
  selectedEmployee: any = null;
  statusToUpdate = 'active';

  constructor(private api: ApiService, private notify: NotificationService, public auth: AuthService) {
    effect(() => {
      const page = this.currentPage();
      const size = this.pageSize();
      const search = this.searchTerm();
      untracked(() => this.load());
    });
  }

  ngOnInit() {}

  load() {
    this.api.getPaginatedEmployees(this.currentPage(), this.pageSize(), this.searchTerm()).subscribe({
      next: (res: any) => {
        this.employees.set(res.data);
        this.totalItems.set(res.total);
      },
      error: () => this.notify.error('Failed to load employees')
    });
  }

  onSearch() {
    this.currentPage.set(1);
  }
  
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

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  get pageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalItems() / this.pageSize());
    const current = this.currentPage();
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }


  del(id: number) { 
    if (confirm('Delete?')) {
      this.api.deleteEmployee(id).subscribe({ 
        next: () => { 
          this.notify.success('Deleted'); 
          this.load(); 
        }, 
        error: (e: any) => this.notify.error(e.error?.message || 'Error deleting employee') 
      }); 
    }
  }
}

