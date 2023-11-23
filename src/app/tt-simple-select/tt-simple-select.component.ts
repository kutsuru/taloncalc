import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

type ListEntry = {
  value: string | number,
  name: string
}

@Component({
  selector: 'tt-simple-select',
  templateUrl: './tt-simple-select.component.html',
  styleUrls: ['./tt-simple-select.component.scss']
})
export class TtSimpleSelectComponent implements OnInit, OnChanges {
  /* components data */
  @Input() prefix: string = '';
  @Input() values: Array<string | number> = [];
  @Input() value!: string | number;
  @Output() valueChange = new EventEmitter<string | number>();
  @Input() names: string[] = [];
  @Output() change: EventEmitter<MatSelectChange> = new EventEmitter<MatSelectChange>();

  /* etc */
  selectData: ListEntry[] = [];

  constructor(private ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    /* create data */
    this.createEntryList();
  }

  ngOnChanges() {
    //TODO: wait for Input changes?!
    this.createEntryList();
  }

  onSelectionChange(ev: MatSelectChange) {
    this.change.emit(ev);
    this.valueChange.emit(ev.value);
  }

  createEntryList() {
    let res: ListEntry[] = [];
    for (let i = 0; i < this.values.length; i++) {
      if (i < this.names.length) {
        res.push({
          value: this.values[i],
          name: this.names[i]
        });
      }
      else {
        res.push({
          value: this.values[i],
          name: `${this.values[i]}`
        });
      }
    }
    this.selectData = res;
  }
}
