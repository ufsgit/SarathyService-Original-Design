import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-vehicle-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-history.component.html',
  styleUrls: ['./vehicle-history.component.css']
})
export class VehicleHistoryComponent implements OnInit, OnDestroy {

  regNo = '';
  customer: any = null;
  invoices: any[] = [];
  searched = false;
  isLoading = false;
  isPdfLoading = false;

  isDropdownLoading = false;
  lastSearchedRegNo = '';

  suggestedRegNos: string[] = [];
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) { }

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length === 0) {
          this.isDropdownLoading = false;
          return of([]);
        }
        this.isDropdownLoading = true;
        return this.api.searchVehicleRegNo(query).pipe(
          catchError(() => {
            this.isDropdownLoading = false;
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (results: any) => {
        this.isDropdownLoading = false;
        this.suggestedRegNos = results;
        if (results.length === 0 && this.regNo.trim().length > 0) {
          this.suggestedRegNos = ['NO_RESULT'];
        }
      },
      error: () => {
        this.isDropdownLoading = false;
        this.suggestedRegNos = [];
      }
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onSearchInput(event: any) {
    this.searchSubject.next(this.regNo);
  }

  selectRegNo(reg: string) {
    if (reg === 'NO_RESULT') return;
    this.regNo = reg;
    this.suggestedRegNos = [];
  }

  search() {
    if (!this.regNo) {
      this.notify.error('Enter registration number');
      return;
    }

    this.isLoading = true;
    this.customer = null;
    this.invoices = [];

    // Step 1: Check if vehicle exists first to give immediate feedback
    this.api.searchVehicleHistory(this.regNo).subscribe({
      next: (d: any) => {
        this.isLoading = false;
        if (!d.customer) {
          this.notify.error('No vehicle found for this registration number');
          return;
        }

        this.customer = d.customer;
        this.invoices = d.invoices;
        this.searched = true;
        this.lastSearchedRegNo = this.regNo;

        // Open PDF automatically on successful search
        this.openPdf();
      },
      error: () => {
        this.isLoading = false;
        this.notify.error('Failed to fetch vehicle history');
      }
    });
  }

  openPdf() {
    const baseUrl = this.api.getVehicleHistoryPDFUrl(this.regNo);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const cb = Date.now();

    // Append token for authentication in the new tab
    const pdfUrl = token ? `${baseUrl}&token=${encodeURIComponent(token)}&cb=${cb}` : `${baseUrl}&cb=${cb}`;

    window.open(pdfUrl, '_blank');
  }
}