import { Component, Input, forwardRef, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-mat-multi-search-select',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatMultiSearchSelectComponent),
      multi: true
    }
  ],
  template: `
    <mat-select 
      [placeholder]="placeholder" 
      multiple 
      [(ngModel)]="selectedValues" 
      (ngModelChange)="onModelChange($event)" 
      (openedChange)="onOpenedChange($event)"
      panelClass="legacy-select-panel"
    >
      <mat-select-trigger>
        {{ getSelectedLabel() }}
      </mat-select-trigger>

      <!-- Sticky Search Box inside Dropdown -->
      <div class="search-box-wrapper" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
        <input 
          #searchInput
          type="text" 
          placeholder="SEARCH..." 
          [(ngModel)]="searchQuery" 
          class="search-input"
        >
      </div>

      <!-- ALL Option -->
      <mat-option [value]="'ALL'">ALL</mat-option>
      
      <!-- Filtered Options -->
      <mat-option *ngFor="let opt of filteredOptions()" [value]="getValue(opt)">
        {{ getDisplay(opt) }}
      </mat-option>
    </mat-select>
  `,
  styles: [`
    .search-box-wrapper {
      position: sticky;
      top: 0;
      z-index: 2;
      background: #ffffff;
      padding: 8px 12px;
      border-bottom: 1px solid #eeeeee;
    }
    .search-input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #cccccc;
      border-radius: 4px;
      font-size: 13px;
      outline: none;
      box-sizing: border-box;
    }
    .search-input:focus {
      border-color: #2b57f5;
    }
  `]
})
export class MatMultiSearchSelectComponent implements ControlValueAccessor, OnChanges {
  @Input() options: any[] = [];
  @Input() placeholder: string = 'ALL';
  @Input() displayKey?: string;
  @Input() valueKey?: string;
  @Input() typeLabel: string = '';

  selectedValues: any[] = [];
  previousValues: any[] = [];
  searchQuery: string = '';
  
  @ViewChild('searchInput') searchInput!: ElementRef;

  // ControlValueAccessor hooks
  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options'] && changes['options'].currentValue) {
      if (this.selectedValues.includes('ALL') || this.selectedValues.length === 0) {
        const allIds = this.options.map(o => this.getValue(o));
        this.selectedValues = ['ALL', ...allIds];
        this.previousValues = [...this.selectedValues];
      }
    }
  }

  writeValue(value: any): void {
    if (!value || value.length === 0) {
      const allIds = this.options.map(o => this.getValue(o));
      this.selectedValues = ['ALL', ...allIds];
    } else {
      if (this.options.length > 0 && value.length === this.options.length) {
        this.selectedValues = ['ALL', ...value];
      } else {
        this.selectedValues = value;
      }
    }
    this.previousValues = [...this.selectedValues];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  getValue(option: any): any {
    return this.valueKey ? option[this.valueKey] : option;
  }

  getDisplay(option: any): string {
    if (this.typeLabel === 'labourCodes' && option.l_name) return `${option.l_name}(${option.l_code})`;
    if ((this.typeLabel === 'mechanics' || this.typeLabel === 'advisors') && option.e_first_name) return `${option.e_first_name} [${option.e_code}]`;
    return this.displayKey ? option[this.displayKey] : option;
  }

  filteredOptions(): any[] {
    if (!this.searchQuery) return this.options;
    const q = this.searchQuery.toLowerCase();
    return this.options.filter(opt => {
      const display = this.getDisplay(opt);
      return display && display.toString().toLowerCase().includes(q);
    });
  }

  onModelChange(val: any[]) {
    const isAllSelected = this.previousValues.includes('ALL');
    const allIds = this.options.map(o => this.getValue(o));

    if (val.includes('ALL') && !isAllSelected) {
        this.selectedValues = ['ALL', ...allIds];
    } else if (!val.includes('ALL') && isAllSelected) {
        this.selectedValues = [];
    } else {
        if (val.includes('ALL') && val.length - 1 < allIds.length) {
            this.selectedValues = val.filter((v: any) => v !== 'ALL');
        }
        if (!val.includes('ALL') && val.length === allIds.length && allIds.length > 0) {
            this.selectedValues = ['ALL', ...allIds];
        }
    }

    this.previousValues = [...this.selectedValues];
    this.emitChange();
  }

  emitChange() {
    if (this.selectedValues.includes('ALL') || this.selectedValues.length === 0) {
      this.onChange([]);
    } else {
      this.onChange(this.selectedValues.filter((v: any) => v !== 'ALL'));
    }
  }

  onOpenedChange(isOpen: boolean) {
    if (isOpen) {
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      });
    } else {
      this.searchQuery = ''; // reset search when closed
      this.onTouched();
    }
  }

  getSelectedLabel(): string {
    const vals = this.selectedValues.filter(v => v !== 'ALL');
    if (this.selectedValues.includes('ALL') || vals.length === 0) {
      return this.placeholder;
    }
    if (vals.length > 1) {
      return `${vals.length} Selected`;
    }
    // Single selection display
    const singleVal = vals[0];
    const opt = this.options.find(o => this.getValue(o) === singleVal);
    if (!opt) return singleVal;
    
    // Custom label formatting logic based on type (to match old UI)
    if (this.typeLabel === 'mechanics' || this.typeLabel === 'advisors') {
      return `${opt.e_first_name} [${opt.e_code}]`;
    }
    if (this.typeLabel === 'insuranceCompanies') {
      return opt.icompany_name;
    }
    if (this.typeLabel === 'labourCodes') {
      return `${opt.l_name}(${opt.l_code})`;
    }
    return this.getDisplay(opt);
  }
}
