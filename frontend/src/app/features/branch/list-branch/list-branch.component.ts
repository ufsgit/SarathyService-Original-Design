import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-list-branch', standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './list-branch.component.html',
  styleUrls: ['./list-branch.component.css']
})
export class ListBranchComponent implements OnInit {
  branches: any[] = [];
  constructor(private api: ApiService, private notify: NotificationService, public auth: AuthService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getBranches().subscribe({ next: (d:any[]) => this.branches = d, error: () => this.notify.error('Failed') }); }
  onDelete(id: number) { if(confirm('Delete?')) this.api.deleteBranch(id).subscribe({ next:()=>{this.notify.success('Deleted');this.load();},error:(e:any)=>this.notify.error(e.error?.message||'Error') }); }
}
