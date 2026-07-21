import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-invoice-edit', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './invoice-edit.component.html',
  styleUrls: ['./invoice-edit.component.css']
})
export class InvoiceEditComponent implements OnInit {
  invoice:any; form:any={}; items:any[]=[];
  constructor(private api:ApiService,private notify:NotificationService,private route:ActivatedRoute,private router:Router){}
  ngOnInit(){
    const id=+this.route.snapshot.params['id'];
    this.api.getInvoice(id).subscribe({next:(d:any)=>{
      this.invoice=d.invoice;
      this.items=d.items.map((it:any)=>({
        ...it,
        ic_disc_per: it.ic_disc_per || 0,
        ic_taxable_amt: it.ic_taxable_amt || it.ic_amount || 0,
        ic_cgst_amt: it.ic_cgst_amt || 0,
        ic_sgst_amt: it.ic_sgst_amt || 0,
        ic_total: it.ic_total || 0
      }));
      this.form={
        inv_discount:d.invoice.inv_discount||0,
        inv_taxable_total: d.invoice.inv_total || 0,
        inv_cgst:d.invoice.inv_cgst || 0,
        inv_sgst:d.invoice.inv_sgst || 0,
        inv_final_amount:d.invoice.inv_final_amount || 0
      };
      this.calcTotals();
    },error:()=>this.notify.error('Not found')});
  }
  addItem(){this.items.push({ic_particular:'',ic_hsn:'998729',ic_qty:1,ic_rate:0,ic_disc_per:0,ic_disc:0,ic_taxable_amt:0,ic_cgst_amt:0,ic_sgst_amt:0,ic_total:0,ic_type:'Paid Service'});}
  calc(i:number){
    const item = this.items[i];
    if (item.ic_type === 'Expense' || item.ic_type === 'Free Service') {
      item.ic_disc = 0; item.ic_taxable_amt = 0; item.ic_cgst_amt = 0; item.ic_sgst_amt = 0; item.ic_total = 0;
    } else {
      const rate = item.ic_rate || 0;
      item.ic_disc = +(rate * (item.ic_disc_per || 0) / 100).toFixed(2);
      item.ic_taxable_amt = +(rate - item.ic_disc).toFixed(2);
      item.ic_cgst_amt = +(item.ic_taxable_amt * 0.09).toFixed(2);
      item.ic_sgst_amt = +(item.ic_taxable_amt * 0.09).toFixed(2);
      item.ic_total = +(item.ic_taxable_amt + item.ic_cgst_amt + item.ic_sgst_amt).toFixed(2);
    }
    this.calcTotals();
  }
  calcTotals(){
    let taxableTotal = 0, cgstTotal = 0, sgstTotal = 0, discTotal = 0;
    this.items.forEach(item => {
      taxableTotal += (item.ic_taxable_amt || 0);
      cgstTotal += (item.ic_cgst_amt || 0);
      sgstTotal += (item.ic_sgst_amt || 0);
      discTotal += (item.ic_disc || 0);
    });
    this.form.inv_taxable_total = +taxableTotal.toFixed(2);
    this.form.inv_cgst = +cgstTotal.toFixed(2);
    this.form.inv_sgst = +sgstTotal.toFixed(2);
    this.form.inv_discount = +discTotal.toFixed(2);
    const grandTotal = taxableTotal + cgstTotal + sgstTotal;
    this.form.inv_total = taxableTotal;
    this.form.inv_final_amount = +grandTotal.toFixed(2);
  }
  isSaving = false;
  onSubmit(){
    this.form.items=this.items;
    this.isSaving = true;
    this.api.updateInvoice(this.invoice.inv_id,this.form).subscribe({
      next:()=>{
        this.isSaving = false;
        this.notify.success('Updated');
        this.router.navigate(['/admin/invoice/list']);
      },
      error:(e:any)=>{
        this.isSaving = false;
        this.notify.error(e.error?.message||'Error');
      }
    });
  }
}
