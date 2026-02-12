import { Component, OnInit } from '@angular/core';
import { DictDb } from '../core/models';
import { TTCoreService } from '../core/tt-core.service';
import { TTSessionInfoService } from '../core/tt-session-info.service';
import { MatCard, MatCardTitleGroup, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { NgFor, KeyValuePipe } from '@angular/common';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { TtValueInfo } from './tt-value-info.pipe';
export interface KeyValue {
  key: string;
  value: any;
}
@Component({
    selector: 'tt-food-old',
    templateUrl: './tt-food.component.html',
    styleUrls: ['./tt-food.component.css'],
    standalone: true,
    imports: [
        MatCard,
        MatCardTitleGroup,
        MatCardTitle,
        MatCardContent,
        MatTabGroup,
        MatTab,
        NgFor,
        MatFormField,
        MatLabel,
        MatSelect,
        MatOption,
        MatCheckbox,
        FormsModule,
        KeyValuePipe,
        TtValueInfo,
    ],
})
export class TtFoodComponentOld implements OnInit {
  protected foodCategoryKVs: { key: string; value: any }[];
  protected foodCategoryKeys: string[] = [];
  protected sessionInfo: DictDb;

  constructor(
    protected ttCore: TTCoreService,
    protected ttSessionInfoService: TTSessionInfoService
  ) {
    this.sessionInfo = this.ttSessionInfoService.sessionInfo;
    this.foodCategoryKVs = [];
  }

  ngOnInit() {
    this.ttCore.initializeCore().subscribe((_) => {
      this.populateFoodComponent();
    });
  }

  populateFoodComponent() {
    this.foodCategoryKeys = [];
    this.foodCategoryKVs = [];
    for (let category in this.ttCore.foodDb) {
      if ('Stats' != category && 'Aspd Potion' != category) {
        this.foodCategoryKeys.push(category);
        this.foodCategoryKVs.push({
          key: category,
          value: this.ttCore.foodDb[category],
        });
      }
    }
  }

  unsorted(a: any, b: any): number {
    return 0;
  }
}
