import { Component, OnInit } from '@angular/core';
import { TTSessionInfoService } from '../core/tt-session-info.service';
import { MatCard, MatCardTitleGroup, MatCardTitle, MatCardContent } from '@angular/material/card';
import { NgFor, NgSwitch, NgSwitchCase, KeyValuePipe } from '@angular/common';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { TtLvArrayPipe } from '../core/tt-lv-array.pipe';

@Component({
    selector: 'tt-buff-old',
    templateUrl: './tt-buff.component.html',
    styleUrls: ['./tt-buff.component.css'],
    standalone: true,
    imports: [
        MatCard,
        MatCardTitleGroup,
        MatCardTitle,
        MatCardContent,
        NgFor,
        NgSwitch,
        NgSwitchCase,
        MatFormField,
        MatLabel,
        MatSelect,
        MatOption,
        MatCheckbox,
        FormsModule,
        KeyValuePipe,
        TtLvArrayPipe,
    ],
})
export class TtBuffComponentOld implements OnInit {
  constructor(protected ttSessionInfoService: TTSessionInfoService) {}

  ngOnInit() {}
}
