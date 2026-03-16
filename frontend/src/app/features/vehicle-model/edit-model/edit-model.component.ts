import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-edit-model', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-model.component.html',
  styleUrls: ['./edit-model.component.css']
})
export class EditModelComponent implements OnInit {
  form:any={};
  constructor(private api:ApiService,private notify:NotificationService,private route:ActivatedRoute,private router:Router){}
  ngOnInit(){const id=+this.route.snapshot.params['id'];this.api.getModel(id).subscribe((d:any)=>this.form=d);}
  onSubmit(){
    this.api.updateModel(this.form.model_id,{mod_name:this.form.mod_name,mod_code:this.form.mod_code}).subscribe({
      next:()=>{this.notify.success('Updated');this.router.navigate(['/admin/model/list']);},
      error:(e:any)=>this.notify.error(e.error?.message||'Error')
    });
  }
}
