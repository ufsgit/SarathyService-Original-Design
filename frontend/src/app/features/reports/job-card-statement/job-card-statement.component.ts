import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-job-card-statement', standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-card-statement.component.html',
  styleUrls: ['./job-card-statement.component.css']
})
export class JobCardStatementComponent implements OnInit {
  filters:any={from_date:'',to_date:'',job_card_no:'',branch:''}; options:any={}; results:any[]=[]; totalAmount=0; searched=false;
  constructor(private api:ApiService,private notify:NotificationService){}
  ngOnInit(){this.api.getFilterOptions().subscribe((d:any)=>this.options=d);const today=new Date().toISOString().split('T')[0];this.filters.from_date=today;this.filters.to_date=today;}
  search(){
    if(!this.filters.from_date||!this.filters.to_date){this.notify.error('Select dates');return;}
    this.api.getJobCardStatement(this.filters).subscribe({next:(d:any)=>{this.results=d.data;this.totalAmount=d.totalAmount;this.searched=true;},error:()=>this.notify.error('Failed')});
  }
}
