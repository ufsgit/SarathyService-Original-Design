import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-edit-labour', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-labour.component.html',
  styleUrls: ['./edit-labour.component.css']
})
export class EditLabourComponent implements OnInit {
  form:any={};
  constructor(private api:ApiService,private notify:NotificationService,private route:ActivatedRoute,private router:Router){}
  ngOnInit(){const id=+this.route.snapshot.params['id'];this.api.getLabour(id).subscribe((d:any)=>this.form=d);}
  onSubmit(){
    this.api.updateLabour(this.form.l_id,this.form).subscribe({
      next:()=>{this.notify.success('Updated');this.router.navigate(['/admin/labour/list']);},
      error:(e:any)=>this.notify.error(e.error?.message||'Error')
    });
  }
}
