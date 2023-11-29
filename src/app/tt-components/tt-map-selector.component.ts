import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { KeyValue } from '../core/filtered-key-value.pipe';
import { DictDb } from '../core/models';

@Component({
  selector: 'tt-map-select',
  template: `
  <mat-form-field>
    <mat-label>{{ selector_name }}</mat-label>
      <mat-select [(ngModel)]="selection" 
      (selectionChange)="onSelectionChange($event)">
        <mat-option *ngFor="let item of content" [value]="item.value">
          {{item.key}}
        </mat-option>
    </mat-select>
  </mat-form-field>`,
  styles: [`.mat-mdc-form-field { margin:4px } `],
})
export class TtMapSelectorComponent {
  

  @Input('name')
  selector_name: string = 'Map Selector';
  @Input('data')
  content: KeyValue<string, any>[] | null = null;
  @Input()
  sort: boolean = true;
  @Input()
  flag: boolean = false;
  @Input()
  mask: number = 0;
  @Input()
  maskKey: string = 'job';

  selection = null;
  @Output()
  selectionChange = new EventEmitter<MatSelectChange>();

  onSelectionChange(event: MatSelectChange) {
    this.selectionChange.emit(event);
  }

  compareMask(value: DictDb): boolean {
    if (this.mask > 0)
      return (Number(value[this.maskKey]) & this.mask) === this.mask;
    return !value[this.maskKey];
  }
}
