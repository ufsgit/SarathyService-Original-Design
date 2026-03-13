import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-vehicle-history', standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-history.component.html',
  styleUrls: ['./vehicle-history.component.css']
})
export class VehicleHistoryComponent {
  regNo=''; customer:any=null; invoices:any[]=[]; searched=false;
  constructor(private api:ApiService,private notify:NotificationService){}
  search(){
    if(!this.regNo){this.notify.error('Enter registration number');return;}
    this.api.searchVehicleHistory(this.regNo).subscribe({
      next:(d:any)=>{this.customer=d.customer;this.invoices=d.invoices;this.searched=true;},
      error:()=>this.notify.error('Failed')
    });
  }
}
