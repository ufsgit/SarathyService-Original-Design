import { Component, OnInit, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-list-branch', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-branch.component.html',
  styleUrls: ['./list-branch.component.css']
})
export class ListBranchComponent implements OnInit {
  branches = signal<any[]>([]);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalItems = signal<number>(0);

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
    this.api.getPaginatedBranches(this.currentPage(), this.pageSize(), this.searchTerm()).subscribe({
      next: (res: any) => {
        this.branches.set(res.data);
        this.totalItems.set(res.total);
      },
      error: () => this.notify.error('Failed to load branches')
    });
  }

  onSearch() {
    this.currentPage.set(1);
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this branch?')) {
      this.api.deleteBranch(id).subscribe({
        next: () => {
          this.notify.success('Branch deleted');
          this.load();
        },
        error: (e: any) => this.notify.error(e.error?.message || 'Error deleting branch')
      });
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  get pageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalItems() / this.pageSize());
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
}
