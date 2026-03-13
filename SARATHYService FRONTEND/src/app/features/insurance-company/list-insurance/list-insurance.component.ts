import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-list-insurance', standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './list-insurance.component.html',
  styleUrls: ['./list-insurance.component.css']
})
export class ListInsuranceComponent implements OnInit {
  companies:any[]=[];
  constructor(private api:ApiService,private notify:NotificationService,public auth:AuthService){}
  ngOnInit(){this.load();}
  load(){this.api.getInsuranceCompanies().subscribe({next:(d:any[])=>this.companies=d,error:()=>this.notify.error('Failed')});}
  del(id:number){if(confirm('Delete?'))this.api.deleteInsuranceCompany(id).subscribe({next:()=>{this.notify.success('Deleted');this.load();},error:(e:any)=>this.notify.error(e.error?.message||'Error')});}
}
