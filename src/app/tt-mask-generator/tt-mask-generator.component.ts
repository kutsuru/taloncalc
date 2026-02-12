import { Component, OnInit } from '@angular/core';
import { DictDb } from '../core/models';
import { TTCoreService } from '../core/tt-core.service';
import { MatCard, MatCardTitleGroup, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { KeyValuePipe } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'tt-mask-generator',
    templateUrl: './tt-mask-generator.component.html',
    styleUrls: ['./tt-mask-generator.component.css'],
    imports: [
    MatCard,
    MatCardTitleGroup,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatGridList,
    MatGridTile,
    MatCheckbox,
    FormsModule,
    KeyValuePipe
]
})
export class TtMaskGeneratorComponent implements OnInit {
  protected cols = 1;

  protected mask: number;
  protected maskDisplay: string;
  protected selectedClasses: DictDb;
  constructor(protected ttCore: TTCoreService) {
    this.mask = 0x0;
    this.maskDisplay = '';
    this.selectedClasses = {};
  }

  ngOnInit() {
    this.ttCore.initializeCore().subscribe((_) => {
      this.initClassSelection();
    });
  }

  initClassSelection() {
    this.selectedClasses = {
      'Non Trans': { checked: false, info: { mask: 0x1 } },
      Trans: { checked: false, info: { mask: 0x2 } },
    };
    for (let key in this.ttCore.jobDb)
      if (!this.ttCore.jobDb[key]['isTrans'])
        this.selectedClasses[key] = {
          checked: false,
          info: this.ttCore.jobDb[key],
        };
  }

  updateMask(className: string, classInfo: any) {
    let jobMask: number = classInfo['mask'];

    // Always remove the non-trans/trans bit
    if (jobMask > 0x2) jobMask = (jobMask >> 2) << 2;

    if (this.selectedClasses[className]['checked']) this.mask |= jobMask;
    else this.mask -= jobMask;

    this.maskDisplay = '0x' + this.mask.toString(16);
  }

  unsorted(a: any, b: any): number {
    return 0;
  }
}
