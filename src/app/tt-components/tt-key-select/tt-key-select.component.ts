import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { TTSessionInfoService } from '../../core/tt-session-info.service';

@Component({
  selector: 'tt-key-select',
  templateUrl: './tt-key-select.component.html',
  styleUrls: ['./tt-key-select.component.css'],
})
export class TtKeySelectComponent implements OnInit {
  protected _serviceData: any;
  constructor(protected ttSessionInfoService: TTSessionInfoService) {
    this._serviceData = null;
  }

  @Input() name: string = '';
  @Input() data: string[] | null = null;
  @Input() key: string = '';
  @Input() keyPath: string = '';
  @Input() defaultValue: string = '';

  @Output()
  selectionChange = new EventEmitter<MatSelectChange>();

  ngOnInit() {
    this._serviceData = this.ttSessionInfoService.sessionInfo;
    if (this.keyPath && this._serviceData) {
      let keys = this.keyPath.split('|');
      for (let k of keys) this._serviceData = this._serviceData[k];
    }
  }

  onSelectionChange(event: MatSelectChange) {
    this.selectionChange.emit(event);
  }
}
