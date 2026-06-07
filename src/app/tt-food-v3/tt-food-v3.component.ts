import { Component, computed, inject } from '@angular/core';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { DBFood, FoodStatsNames } from '../core/tt-models.v3';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

type FoodUI = DBFood & {
  isActive: boolean
}

@Component({
  selector: 'tt-food-v3',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatSlideToggleModule
  ],
  templateUrl: './tt-food-v3.component.html',
  styleUrl: './tt-food-v3.component.scss',
})
export class TtFoodV3Component {
  /* injects */
  private readonly _core = inject(TTCoreServiceV3);
  readonly session = inject(TTSessionInfoV3Service);

  /* stat foods */
  readonly statNames = ['STR', 'AGI', 'VIT', 'INT', 'DEX', 'LUK'];
  allFoods = computed(() => {
    return Array.from(this._core.foodDB.values());
  });

  statFoods = computed(() => {
    const allFoods = this.allFoods();
    /* get all stat foods, grouped by STAT */
    return this.statNames.map((statName) => {
      return {
        name: statName as FoodStatsNames,
        foods: allFoods.filter((food) => food.subCategory === statName as FoodStatsNames)
      }
    })
  });

  otherFoods = computed(() => {
    const allFoods = this.allFoods();
    const allOtherFoods = this.session.foodsOther();

    const foodsByGroup: Map<string, FoodUI[]> = new Map();
    for (const food of allFoods) {
      if (food.category === 'Stats' || food.category === 'Aspd Potion') continue;

      if (!foodsByGroup.has(food.category)) {
        foodsByGroup.set(food.category, []);
      }
      foodsByGroup.get(food.category)!.push({
        ...food,
        isActive: allOtherFoods.includes(food.ID)
      });
    }

    /* create array */
    return Array.from(foodsByGroup.entries()).map(([category, foods]) => {
      return {
        group: category,
        foods: foods
      }
    })
  });

  /*** public functions ***/
}
