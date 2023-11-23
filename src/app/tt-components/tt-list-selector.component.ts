import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatLegacySelectChange as MatSelectChange } from '@angular/material/legacy-select';
import { TTSessionInfoService } from '../core/tt-session-info.service';

// [formControl]="selectorControl"
@Component({
  selector: 'tt-list-select',
  template: `
  <mat-form-field class="stat">
    <mat-label>{{ name }}</mat-label>
      <mat-select [(value)]="_serviceData[key]" (selectionChange)="onSelectionChange($event)">
        <mat-select-trigger>
          <span *ngIf="displayPrefix">+ </span>
          {{ _serviceData[key] }}
          <span *ngIf="displaySuffix && _serviceBonusData"> + {{ _serviceBonusData[key] + _serviceBonusData[key2]}}</span>
        </mat-select-trigger>
        <mat-option *ngFor="let item of data" [value]="item"
        [ngStyle]="{ display : hasLimit && item > maxValue ? 'none' : 'block' }">
          {{ item }} 
        </mat-option>
    </mat-select>
  </mat-form-field>`,
  styles: [`.mat-form-field { width:80px; margin:4px }`],
})
export class TtListSelectorComponent implements OnInit {
  protected _serviceData: any;
  protected _serviceBonusData: any;
  constructor(protected ttSessionInfoService: TTSessionInfoService) {
    this._serviceData = null;
    this._serviceBonusData = null;
  }

  @Input() key: string = '';
  @Input() key2: string = '';
  @Input() keyPath: string = 'baseStats';
  @Input() keyBonusPath: string = 'activeBonus';
  @Input() name: string = '';
  @Input() data: any[] | null = null;
  @Input('max') maxValue: number = 80;
  @Input('flag') hasLimit: boolean = false;
  @Input() displaySuffix: boolean = true;
  @Input() displayPrefix: boolean = false;

  ngOnInit() {
    this._serviceData = this.ttSessionInfoService.sessionInfo;
    if (this.keyPath && this._serviceData) {
      let keys = this.keyPath.split('|');
      for (let k of keys) this._serviceData = this._serviceData[k];
    }

    if (this.displaySuffix) {
      this._serviceBonusData = this.ttSessionInfoService.sessionInfo;
      if (this.keyBonusPath && this._serviceBonusData) {
        let keys = this.keyBonusPath.split('|');
        for (let k of keys) this._serviceBonusData = this._serviceBonusData[k];
      }
    }
  }

  @Output() selectionChange = new EventEmitter<MatSelectChange>();

  onSelectionChange(event: MatSelectChange) {
    this.selectionChange.emit(event);
  }
}
