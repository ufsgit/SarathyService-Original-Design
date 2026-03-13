import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-edit-insurance', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-insurance.component.html',
  styleUrls: ['./edit-insurance.component.css']
})
export class EditInsuranceComponent implements OnInit {
  form:any={};
  constructor(private api:ApiService,private notify:NotificationService,private route:ActivatedRoute,private router:Router){}
  ngOnInit(){const id=+this.route.snapshot.params['id'];this.api.getInsuranceCompany(id).subscribe((d:any)=>this.form=d);}
  onSubmit(){
    this.api.updateInsuranceCompany(this.form.com_id,this.form).subscribe({
      next:()=>{this.notify.success('Updated');this.router.navigate(['/admin/insurance/list']);},
      error:(e:any)=>this.notify.error(e.error?.message||'Error')
    });
  }
}
