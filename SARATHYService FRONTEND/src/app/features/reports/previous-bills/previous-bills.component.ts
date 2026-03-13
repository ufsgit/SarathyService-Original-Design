import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBills',
  standalone: true
})
export class FilterBillsPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;
    searchText = searchText.toLowerCase();
    return items.filter(it => {
      return (it.in_registr?.toLowerCase().includes(searchText)) ||
             (it.inv_cus?.toLowerCase().includes(searchText)) ||
             (it.inv_job_card_no?.toString().includes(searchText)) ||
             (it.inv_no?.toLowerCase().includes(searchText));
    });
  }
}

@Component({
  selector: 'app-previous-bills', standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FilterBillsPipe],
  templateUrl: './previous-bills.component.html',
  styleUrls: ['./previous-bills.component.css']
})
export class PreviousBillsComponent implements OnInit {
  bills:any[]=[]; type='labour'; searchText = '';
  constructor(public api:ApiService,private notify:NotificationService,private route:ActivatedRoute){}
  ngOnInit(){
    this.type=this.route.snapshot.data['type']||'labour';
    if(this.type==='labour')this.api.getPreviousLabourBills().subscribe({next:(d:any[])=>this.bills=d,error:()=>this.notify.error('Failed')});
    else this.api.getPreviousInsuranceBills().subscribe({next:(d:any[])=>this.bills=d,error:()=>this.notify.error('Failed')});
  }
}
