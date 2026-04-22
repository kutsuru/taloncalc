import { ChangeDetectionStrategy, Component, computed, inject, Signal, untracked } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ClassAvatarComponent } from "../class-avatar/class-avatar.component";
import { ItemLocations } from '../core/models';
import { DBWeaponTypeKey, DBWeaponTypeLeft, EquipSlotMeta } from '../core/tt-models.v3';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TtEquipSlotComponent } from '../tt-equip-slot/tt-equip-slot.component';
import { isTwoHandedWeapon } from '../core/utils';

type EquipUI = {
  slot: ItemLocations,
  meta: EquipSlotMeta
};

@Component({
  selector: 'tt-equip-v3',
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    TtEquipSlotComponent,
    ClassAvatarComponent
  ],
  templateUrl: './tt-equip-v3.component.html',
  styleUrl: './tt-equip-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEquipV3Component {
  /*** injects ***/
  readonly session = inject(TTSessionInfoV3Service);

  /*** signals ***/
  /* gear lists */
  weaponTypes: Signal<DBWeaponTypeKey[]>;
  leftHandTypes: Signal<DBWeaponTypeLeft[]>;

  isTwoHanded: Signal<boolean> = computed(() => {
    const rhT = this.session.rightHandType();
    return isTwoHandedWeapon(rhT);
  });

  constructor() {
    this.weaponTypes = computed(() => {
      const job = this.session.jobClass();
      if (job) {
        return job.compatibleWeapons;
      }
      else {
        return [];
      }
    });

    this.leftHandTypes = computed(() => {
      const jobClassName = this.session.jobClassName();
      return untracked(() => {
        const job = this.session.jobClass();
        if (job && jobClassName && jobClassName.includes('Assassin')) {
          return [...job.compatibleWeapons, 'Shield'];
        }
        else {
          return ['Unarmed', 'Shield'];
        }
      });
    });
  }

  /*** private function ***/
}
