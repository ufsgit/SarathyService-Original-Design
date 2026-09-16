import { Component, Input, forwardRef, ElementRef, HostListener, ViewChild, Output, EventEmitter } from '@angular/core';
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
  @Input() enableKeyboardNavigation: boolean = false;

  @Output() enterPressed = new EventEmitter<void>();

  selectedValue: string = '';
  searchQuery: string = '';
  isOpen: boolean = false;
  highlightedIndex: number = 0;
  
  // For ControlValueAccessor
  onChange: any = () => {};
  onTouched: any = () => {};

  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('selectBox') selectBox!: ElementRef;

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
      this.highlightedIndex = 0;
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
    this.highlightedIndex = 0;
    setTimeout(() => {
      this.selectBox?.nativeElement.focus();
    }, 0);
  }

  onSelectBoxKeydown(event: KeyboardEvent) {
    if (this.disabled) return;
    if (!this.enableKeyboardNavigation) return;
    
    if (event.key === 'Enter') {
      if (!this.isOpen) {
        if (!this.selectedValue) {
          const options = this.filteredOptions();
          if (options.length > 0) {
            this.selectOption(options[0]);
          }
        } else {
          this.enterPressed.emit();
        }
        event.preventDefault();
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === ' ') {
      if (!this.isOpen) {
        this.isOpen = true;
        this.highlightedIndex = 0;
        setTimeout(() => { this.searchInput?.nativeElement.focus(); }, 0);
        event.preventDefault();
      }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      if (!this.isOpen) {
        this.isOpen = true;
        this.highlightedIndex = 0;
        this.searchQuery = event.key;
        setTimeout(() => { this.searchInput?.nativeElement.focus(); }, 0);
        event.preventDefault();
      }
    }
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (!this.enableKeyboardNavigation) return;
    
    const options = this.filteredOptions();
    if (event.key === 'Enter') {
      event.preventDefault();
      if (options.length > 0) {
        this.selectOption(options[this.highlightedIndex] || options[0]);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.highlightedIndex < options.length - 1) {
        this.highlightedIndex++;
        this.scrollToHighlight();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.highlightedIndex > 0) {
        this.highlightedIndex--;
        this.scrollToHighlight();
      }
    }
  }

  onSearchQueryChange() {
    this.highlightedIndex = 0;
  }

  scrollToHighlight() {
    setTimeout(() => {
      const list = this.eRef.nativeElement.querySelector('.options-list');
      const item = this.eRef.nativeElement.querySelector('.option-item.highlighted');
      if (list && item) {
        const listRect = list.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        if (itemRect.bottom > listRect.bottom) {
          list.scrollTop += itemRect.bottom - listRect.bottom;
        } else if (itemRect.top < listRect.top) {
          list.scrollTop -= listRect.top - itemRect.top;
        }
      }
    }, 0);
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
