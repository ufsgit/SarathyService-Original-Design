import { Component, OnInit, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-list-labour', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-labour.component.html',
  styleUrls: ['./list-labour.component.css']
})
export class ListLabourComponent implements OnInit {
  labours = signal<any[]>([]);
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
    this.api.getPaginatedLabours(this.currentPage(), this.pageSize(), this.searchTerm()).subscribe({
      next: (res: any) => {
        this.labours.set(res.data);
        this.totalItems.set(res.total);
      },
      error: () => this.notify.error('Failed to load labours')
    });
  }

  onSearch() {
    this.currentPage.set(1);
  }

  del(id: number) {
    if (confirm('Are you sure you want to delete this labour code?')) {
      this.api.deleteLabour(id).subscribe({
        next: () => {
          this.notify.success('Labour deleted');
          this.load();
        },
        error: (e: any) => this.notify.error(e.error?.message || 'Error deleting labour')
      });
    }
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

}
