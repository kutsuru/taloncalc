import { Component, OnInit } from '@angular/core';
import { DictDb } from '../core/models';
import { TTCoreService } from '../core/tt-core.service';
import { TTSessionInfoService } from '../core/tt-session-info.service';
export interface KeyValue {
  key: string;
  value: any;
}
@Component({
  selector: 'tt-food',
  templateUrl: './tt-food.component.html',
  styleUrls: ['./tt-food.component.css'],
})
export class TtFoodComponent implements OnInit {
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
