import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-list-labour', standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './list-labour.component.html',
  styleUrls: ['./list-labour.component.css']
})
export class ListLabourComponent implements OnInit {
  labours:any[]=[];
  constructor(private api:ApiService,private notify:NotificationService,public auth:AuthService){}
  ngOnInit(){this.load();}
  load(){this.api.getLabours().subscribe({next:(d:any[])=>this.labours=d,error:()=>this.notify.error('Failed')});}
  del(id:number){if(confirm('Delete?'))this.api.deleteLabour(id).subscribe({next:()=>{this.notify.success('Deleted');this.load();},error:(e:any)=>this.notify.error(e.error?.message||'Error')});}
}
