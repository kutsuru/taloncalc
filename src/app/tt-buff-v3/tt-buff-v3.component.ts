import { Component, computed, inject, Pipe, PipeTransform, Signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';

type SimpelSelect<T> = {
  name: string,
  value: T
}

@Pipe({ name: 'levelArray' })
export class LevelArrayPipe implements PipeTransform {
  transform(value: number) {
    return Array.from({ length: value + 1 }, (_, i) => i);
  }
}

@Component({
  selector: 'tt-buff-v3',
  imports: [MatFormFieldModule, MatSelectModule, LevelArrayPipe, MatSlideToggleModule],
  templateUrl: './tt-buff-v3.component.html',
  styleUrl: './tt-buff-v3.component.scss',
})
export class TtBuffV3Component {
  /* injects */
  readonly session = inject(TTSessionInfoV3Service);
  private readonly _core = inject(TTCoreServiceV3);

  speedPotions: Signal<SimpelSelect<number>[]> = computed(() => {
    this._core.$loaded();
    // this.session.jobClass();  // FIXME: filter the potions
    const res: SimpelSelect<number>[] = [];

    /* get all foods from DB */
    for (const [id, food] of this._core.foodDB) {
      if (food.category === 'Aspd Potion') {
        res.push({
          name: food.name,
          value: food.ID
        });
      }
    }
    return res;
  });

  pets: Signal<SimpelSelect<number>[]> = computed(() => {
    this._core.$loaded();

    const res: SimpelSelect<number>[] = [{ name: 'No pet', value: 0 }];
    for (const pet of this._core.petDB.valuesSorted()) {
      res.push({
        name: `${pet.name} (${pet.desc.substring(0, 25)})`,
        value: pet.ID
      });
    }
    return res;
  });

  /*** public functions ***/
  updateBuffValue(skillId: number, value: number | boolean) {
    this.session.updateSkillBuff(skillId, value);
  }
  updateSpeedPoition(foodId: number) {
    this.session.speedPotion.set(foodId);
  }
  updatePet(petId: number) {
    this.session.pet.set(petId);
  }
}
