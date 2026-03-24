import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-list-insurance', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-insurance.component.html',
  styleUrls: ['./list-insurance.component.css']
})
export class ListInsuranceComponent implements OnInit {
  companies:any[]=[];
  page = 1;
  limit = 10;
  total = 0;
  search = '';

  constructor(private api:ApiService,private notify:NotificationService,public auth:AuthService){}
  
  ngOnInit(){this.load();}
  
  load(){
    this.api.getInsuranceCompaniesPaginated(this.page, this.limit, this.search).subscribe({
      next:(res:any)=>{
        this.companies=res.data;
        this.total=res.total;
        this.page=res.page;
      },
      error:()=>this.notify.error('Failed')
    });
  }

  onSearch() {
    this.page = 1;
    this.load();
  }

  nextPage() {
    if (this.page * this.limit < this.total) {
      this.page++;
      this.load();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  goToPage(p: any) {
    if (typeof p === 'number') {
      this.page = p;
      this.load();
    }
  }

  getLastPage(): number {
    return Math.ceil(this.total / this.limit) || 1;
  }

  getPages(): (number | string)[] {
    const totalPages = this.getLastPage();
    const current = this.page;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (current >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', current - 1, current, current + 1, '...', totalPages];
  }

  del(id:number){
    if(confirm('Delete?'))
      this.api.deleteInsuranceCompany(id).subscribe({
        next:()=>{this.notify.success('Deleted');this.load();},
        error:(e:any)=>this.notify.error(e.error?.message||'Error')
      });
  }
}
