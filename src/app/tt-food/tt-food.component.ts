import { Component, OnInit } from '@angular/core';
import { TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { filter } from 'rxjs';
import { TTCoreService } from '../core/tt-core.service';
import { ActiveFood, Food, FoodDB_V2, FoodStatsObj, ObjWithKeyString, StatFood } from '../core/models';
import { SESSION_INFO_DEFAULT } from '../core/session-info-default';
import { KeyValue, KeyValuePipe } from '@angular/common';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'tt-food',
    templateUrl: './tt-food.component.html',
    styleUrl: './tt-food.component.scss',
    imports: [MatTabGroup, MatTab, MatFormField, MatLabel, MatSelect, MatOption, MatCheckbox, FormsModule, KeyValuePipe]
})
export class TtFoodComponent implements OnInit {
  protected statFoods!: FoodStatsObj<ObjWithKeyString<StatFood>>;
  protected otherFoods: { [key: string]: ObjWithKeyString<Food> } = {};
  // TODO: connection between session info data and this data should be removed
  protected activeFoods: ActiveFood = { ...SESSION_INFO_DEFAULT.activeFood };

  constructor(private sessionInfo: TTSessionInfoV2Service, private core: TTCoreService) { }

  ngOnInit(): void {
    this.core.loaded$.pipe(filter((_) => _)).subscribe((_) => {
      /* only get called when core init. is true */
      // get stat foods
      this.statFoods = this.core.foodDbV2.Stats;
      // get all the other foods
      for (let foodCat in this.core.foodDbV2) {
        if (foodCat !== 'Stats' && foodCat !== 'Aspd Potion') {
          this.otherFoods[foodCat] = <ObjWithKeyString<Food>>this.core.foodDbV2[foodCat as keyof FoodDB_V2];
        }
      }
    });
  }

  foodChanged() {
    this.sessionInfo.changeFood();
  }

  originalOrder(a: any, b: any): number {
    return 0;
  }
}