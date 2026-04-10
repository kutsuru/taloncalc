import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DBItem, EquipLocation, RefineLocations, DBWeaponTypeKey, DBWeaponTypeLeft, EQUIP_META } from '../core/tt-models.v3';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TtCardSlotV3Component } from "../tt-card-slot-v3/tt-card-slot-v3.component";
import { ItemLocations } from '../core/models';
import { TtEquipSlotComponent } from '../tt-equip-slot/tt-equip-slot.component';

type GearItem = Pick<DBItem, 'ID' | 'name'>;
@Component({
  selector: 'tt-equip-v3',
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    TtEquipSlotComponent
  ],
  templateUrl: './tt-equip-v3.component.html',
  styleUrl: './tt-equip-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEquipV3Component {
  /*** injects ***/
  private readonly _core = inject(TTCoreServiceV3);
  readonly session = inject(TTSessionInfoV3Service);

  /*** varbs ***/
  /* equipment */
  equip = computed(() => {
    return (Object.keys(EQUIP_META) as ItemLocations[]).map(slot => ({
      slot,
      meta: EQUIP_META[slot]
    }))
  });

  /* gear lists */
  weaponTypes: Signal<DBWeaponTypeKey[]>;
  leftHandTypes: Signal<DBWeaponTypeLeft[]>;

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
