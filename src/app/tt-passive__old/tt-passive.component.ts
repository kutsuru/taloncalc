import { Component, OnInit } from '@angular/core';
import { TTSessionInfoService } from '../core/tt-session-info.service';
import { MatCard, MatCardTitleGroup, MatCardTitle, MatCardContent } from '@angular/material/card';
import { NgFor, NgSwitch, NgSwitchDefault, NgSwitchCase, KeyValuePipe } from '@angular/common';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { TtLvArrayPipe } from '../core/tt-lv-array.pipe';

@Component({
    selector: 'tt-passive-old',
    templateUrl: './tt-passive.component.html',
    styleUrls: ['./tt-passive.component.css'],
    standalone: true,
    imports: [
        MatCard,
        MatCardTitleGroup,
        MatCardTitle,
        MatCardContent,
        NgFor,
        NgSwitch,
        NgSwitchDefault,
        MatFormField,
        MatLabel,
        MatSelect,
        MatOption,
        NgSwitchCase,
        MatCheckbox,
        FormsModule,
        KeyValuePipe,
        TtLvArrayPipe,
    ],
})
export class TtPassiveComponentOld implements OnInit {
  constructor(protected ttSessionInfoService: TTSessionInfoService) {}

  ngOnInit() {}
}
