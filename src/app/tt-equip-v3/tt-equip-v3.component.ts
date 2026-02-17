import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Item } from '../core/models';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { WeaponType, WeaponTypeLeft } from '../core/models.v3';

@Component({
  selector: 'tt-equip-v3',
  imports: [MatFormFieldModule, ReactiveFormsModule, MatSelectModule],
  templateUrl: './tt-equip-v3.component.html',
  styleUrl: './tt-equip-v3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEquipV3Component {
  /*** injects ***/
  private readonly _core = inject(TTCoreServiceV3);
  private readonly _session = inject(TTSessionInfoV3Service);

  /*** varbs ***/
  equipMask: Signal<number>;
  gears = new FormGroup({
    armor: new FormControl('', { nonNullable: true }),
    garment: new FormControl('', { nonNullable: true }),
    leftHand: new FormControl('', { nonNullable: true }),
    leftHandType: new FormControl<WeaponTypeLeft>('Shield', { nonNullable: true }),
    rightHandType: new FormControl<WeaponType>('Dagger', { nonNullable: true }),  // DAGGER?!
    lhAccessory: new FormControl('', { nonNullable: true }),
    lowerHg: new FormControl('', { nonNullable: true }),
    middleHg: new FormControl('', { nonNullable: true }),
    rhAccessory: new FormControl('', { nonNullable: true }),
    rightHand: new FormControl('', { nonNullable: true }),
    shoes: new FormControl('', { nonNullable: true }),
    upperHg: new FormControl('', { nonNullable: true })
  });
  rightHandLast = '';
  $weaponType: Signal<WeaponType>;
  $leftHandType: Signal<WeaponTypeLeft>;

  /*** gear lists ***/
  weaponTypes: Signal<WeaponType[]>;
  leftHandTypes: Signal<WeaponTypeLeft[]>;
  upperHgList: Signal<string[]>;
  middleHgList: Signal<string[]>;
  lowerHgList: Signal<string[]>;
  armorList: Signal<string[]>;
  weaponList: Signal<string[]>;
  leftHandList: Signal<string[]>; // Shield or Weapon (for Assa)
  garmentList: Signal<string[]>;
  shoeList: Signal<string[]>;
  accessorieList: Signal<string[]>;

  constructor() {
    this.equipMask = computed(() => {
      const jobClass = this._session.jobClass();
      if (jobClass) {
        return Number(jobClass.mask);
      }
      else {
        return 0xfffffff;
      }
    });

    this.weaponTypes = computed(() => {
      const job = this._session.jobClass();
      if (job) {
        return job.compatibleWeapons;
      }
      else {
        return [];
      }
    });

    this.leftHandTypes = computed(() => {
      // const jobClassName = this._session.jobClassName();
      // return untracked(() => {
      //   const job = this._session.jobClass();
      //   if (job && jobClassName && jobClassName.includes('Assassin')) {
      //     return [...job.compatibleWeapons, 'Shield'];
      //   }
      //   else {
      //     return ['Unarmed', 'Shield'];
      //   }
      // });
      return [];
    });

    this.$leftHandType = toSignal(this.gears.controls.leftHandType.valueChanges, { initialValue: 'Shield' });
    this.$weaponType = toSignal(this.gears.controls.rightHandType.valueChanges, { initialValue: 'Dagger' });

    /* equip lists */
    this.upperHgList = computed(() => {
      // return this._computeGearList(this._core.headgearDbV2.Upper);
      return [];
    });
    this.middleHgList = computed(() => {
      // return this._computeGearList(this._core.headgearDbV2.Middle);
      return [];
    });
    this.lowerHgList = computed(() => {
      // return this._computeGearList(this._core.headgearDbV2.Lower);
      return [];
    });
    this.armorList = computed(() => {
      // return this._computeGearList(this._core.armorDbV2);
      return [];
    });
    this.garmentList = computed(() => {
      // return this._computeGearList(this._core.garmentDbV2);
      return [];
    });
    this.shoeList = computed(() => {
      // return this._computeGearList(this._core.shoesDbV2);
      return [];
    });
    this.accessorieList = computed(() => {
      // return this._computeGearList(this._core.accessoryDbV2);
      return [];
    });
    this.weaponList = computed(() => {
      const wT = this.$weaponType();
      // return this._computeGearList(this._core.weaponDbV2[wT]);
      return [];
    });
    this.leftHandList = computed(() => {
      const leftHandType = this.$leftHandType();
      if (leftHandType === 'Shield') {
        // return this._computeGearList(this._core.shieldDbV2);
        return [];
      }
      else {
        // return this._computeGearList(this._core.weaponDbV2[leftHandType]);
        return [];
      }
    });

    /* update gears based on equips from session */
    effect(() => {
      const equips = this._session.equip();
      /* change gear only if changed */
      Object.entries(equips).forEach(([key, value]) => {
        const control = this.gears.get(key);
        if (control && control.value !== value) {
          console.log(`${key} changed to ${value}`);
          control.setValue(value);  // TODO: , { emitEvent: false } to cancel loops in session?
        }
      });
    });

    /* update gears in session on selection */
    this.gears.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      // this._session.equip.update(old => {
      //   return { ...old, ...value };
      // });
    });

    /* update right hand if list changed */
    effect(() => {
      // TODO: when class changes but still same left hand type is valid, do change selection
      const waepons = this.weaponList();
      this.gears.controls.rightHand.setValue(waepons[0]);
    });
    /* update left hand if left hand list changes */
    effect(() => {
      // TODO: when class changes but still same left hand type is valid, do change selection
      const leftHands = this.leftHandList();
      this.gears.controls.leftHand.setValue(leftHands[0]);
    });
  }

  /*** private function ***/
  private _computeGearList(data: { [key: string]: Item }): string[] {
    const equipMask = this.equipMask();
    let res: string[] = [];

    for (let dataKey in data) {
      /* filter by mask */
      let curEquipMask = Number(data[dataKey].job);
      if ((curEquipMask & equipMask) == equipMask) {
        res.push(dataKey);
      }
    }
    res.sort((a, b) => (a > b ? 1 : -1));

    return res;
  }
}
