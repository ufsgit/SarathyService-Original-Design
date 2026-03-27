import { Component, Input, forwardRef, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ]
})
export class SearchableSelectComponent implements ControlValueAccessor {
  @Input() options: string[] = [];
  @Input() placeholder: string = 'Select Option';
  @Input() searchPlaceholder: string = 'Search...';
  @Input() customClass: string = '';
  @Input() displayFormatter?: (option: string) => string;
  @Input() disabled: boolean = false;

  selectedValue: string = '';
  searchQuery: string = '';
  isOpen: boolean = false;
  
  // For ControlValueAccessor
  onChange: any = () => {};
  onTouched: any = () => {};

  @ViewChild('searchInput') searchInput!: ElementRef;

  getDisplayValue(): string {
    if (!this.selectedValue) return '';
    return this.displayFormatter ? this.displayFormatter(this.selectedValue) : this.selectedValue;
  }

  filteredOptions(): string[] {
    if (!this.searchQuery) return this.options;
    return this.options.filter(option => 
      option.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 0);
    } else {
      this.searchQuery = '';
    }
  }

  selectOption(option: string) {
    this.selectedValue = option;
    this.onChange(option);
    this.isOpen = false;
    this.searchQuery = '';
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    this.selectedValue = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.searchQuery = '';
    }
  }

  constructor(private eRef: ElementRef) {}
}
