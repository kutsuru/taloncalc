import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, Signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Item } from '../core/models';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { DBItem, EquipLocation, RefineLocations, SessionEquip, WeaponType, WeaponTypeLeft } from '../core/models.v3';
import { TtCardSlotV3Component } from "../tt-card-slot-v3/tt-card-slot-v3.component";

type GearItem = Pick<DBItem, 'ID' | 'name'>;
@Component({
  selector: 'tt-equip-v3',
  imports: [MatFormFieldModule, ReactiveFormsModule, MatSelectModule, TtCardSlotV3Component],
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
  /* gear */
  gears = new FormGroup({
    armor: new FormControl(0, { nonNullable: true }),
    garment: new FormControl(0, { nonNullable: true }),
    leftHand: new FormControl(0, { nonNullable: true }),
    leftHandType: new FormControl<WeaponTypeLeft>('Unarmed', { nonNullable: true }),
    rightHandType: new FormControl<WeaponType>('Unarmed', { nonNullable: true }),
    lhAccessory: new FormControl(0, { nonNullable: true }),
    lowerHg: new FormControl(0, { nonNullable: true }),
    middleHg: new FormControl(0, { nonNullable: true }),
    rhAccessory: new FormControl(0, { nonNullable: true }),
    rightHand: new FormControl(0, { nonNullable: true }),
    shoes: new FormControl(0, { nonNullable: true }),
    upperHg: new FormControl(0, { nonNullable: true })
  });
  rightHandLast = '';
  $weaponType: Signal<WeaponType>;
  $leftHandType: Signal<WeaponTypeLeft>;

  /* refines */
  readonly maxRefine: number = 10;
  readonly maxRefines = Array.from({ length: this.maxRefine + 1 }, (_, i) => i);
  refines: FormGroup<Record<RefineLocations, FormControl<number>>> = new FormGroup({
    armor: new FormControl(0, { nonNullable: true }),
    garment: new FormControl(0, { nonNullable: true }),
    leftHand: new FormControl(0, { nonNullable: true }),
    rightHand: new FormControl(0, { nonNullable: true }),
    shoes: new FormControl(0, { nonNullable: true }),
    upperHg: new FormControl(0, { nonNullable: true }),
  });

  /* cards */
  debugCard = signal(4140);

  /* gear lists */
  weaponTypes: Signal<WeaponType[]>;
  leftHandTypes: Signal<WeaponTypeLeft[]>;
  upperHgList: Signal<GearItem[]>;
  middleHgList: Signal<GearItem[]>;
  lowerHgList: Signal<GearItem[]>;
  armorList: Signal<GearItem[]>;
  weaponList: Signal<GearItem[]>;
  leftHandList: Signal<GearItem[]>; // Shield or Weapon (for Assa)
  garmentList: Signal<GearItem[]>;
  shoesList: Signal<GearItem[]>;
  accessorieList: Signal<GearItem[]>;

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
      const jobClassName = this._session.jobClassName();
      return untracked(() => {
        const job = this._session.jobClass();
        if (job && jobClassName && jobClassName.includes('Assassin')) {
          return [...job.compatibleWeapons, 'Shield'];
        }
        else {
          return ['Unarmed', 'Shield'];
        }
      });
    });

    this.$leftHandType = toSignal(this.gears.controls.leftHandType.valueChanges, { initialValue: 'Unarmed' });
    this.$weaponType = toSignal(this.gears.controls.rightHandType.valueChanges, { initialValue: 'Unarmed' });

    /* equip lists */
    this.upperHgList = computed(() => {
      return this._computeGearList(this._core.headgearDB, '(No Upper Headgear)', 'HeadgearUpper');
    });
    this.middleHgList = computed(() => {
      return this._computeGearList(this._core.headgearDB, '(No Middle Headgear)', 'HeadgearMiddle');
    });
    this.lowerHgList = computed(() => {
      return this._computeGearList(this._core.headgearDB, '(No Lower Headgear)', 'HeadgearLower');
    });
    this.armorList = computed(() => {
      return this._computeGearList(this._core.armorDB, '(No Armor)');
    });
    this.garmentList = computed(() => {
      return this._computeGearList(this._core.garmentDB, '(No Garment)');
    });
    this.shoesList = computed(() => {
      return this._computeGearList(this._core.shoesDB, '(No Shoes)');
    });
    this.accessorieList = computed(() => {
      return this._computeGearList(this._core.accessoryDB, '(No Accessory)');
    });
    this.weaponList = computed(() => {
      const wT = this.$weaponType();
      if (wT === 'Unarmed') {
        return [{
          ID: 0,
          name: '(Unarmed)'
        }];
      }
      else {
        return this._computeWeaponList(wT);
      }
    });
    this.leftHandList = computed(() => {
      const leftHandType = this.$leftHandType();
      if (leftHandType === 'Shield') {
        return this._computeGearList(this._core.shieldDB, '(No Shield)');
      }
      else {
        return this._computeWeaponList(leftHandType);
      }
    });

    /* update gears based on equips from session */
    effect(() => {
      const equips = this._session.equip();
      /* change gear only if changed */
      Object.entries(equips).forEach(([key, value]) => {
        const control = this.gears.get(key);
        if (control && control.value !== value) {
          control.setValue(value);  // TODO: , { emitEvent: false } to cancel loops in session?
        }
      });
    });

    /* update gears in session on selection */
    this.gears.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this._session.equip.update(old => {
        return { ...old, ...value };
      });
    });

    /* update right hand if list changed */
    effect(() => {
      // TODO: when class changes but still same left hand type is valid, do change selection
      const waepons = this.weaponList();
      this.gears.controls.rightHand.setValue(0);
    });
    /* update left hand if left hand list changes */
    effect(() => {
      // TODO: when class changes but still same left hand type is valid, do change selection
      const leftHands = this.leftHandList();
      this.gears.controls.leftHand.setValue(0);
    });

    /* update refines in session on selection */
    this.refines.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this._session.refines.update(old => {
        return { ...old, ...value };
      });
    });
    /* update refines (selection) based on session */
    effect(() => {
      const refines = this._session.refines();
      Object.entries(refines).forEach(([key, value]) => {
        const control = this.refines.get(key);
        if (control && control.value !== value) {
          console.log(`refine ${key} changed to ${value}`);
          control.setValue(value);  // TODO: , { emitEvent: false } to cancel loops in session?
        }
      });
    });
  }

  /*** private function ***/
  private _computeWeaponList(weaponType: WeaponType) {
    const equipMask = this.equipMask();
    const res: GearItem[] = [{
      ID: 0,
      name: '(Unarmed)'
    }];
    for (const [id, item] of this._core.weaponDB) {
      if (item.subType !== weaponType) continue;
      if (this._core.canWearItem(equipMask, item)) {
        let name = item.name;
        if (item.slots > 0) {
          name += ` [${item.slots}]`;
        }
        res.push({
          ID: id,
          name
        });
      }
    }
    res.sort((a, b) => (a.name > b.name ? 1 : -1));
    return res;
  }
  private _computeGearList(db: Map<number, DBItem>, noneName: string, location?: EquipLocation): GearItem[] {
    const equipMask = this.equipMask();
    const res: GearItem[] = [{
      ID: 0,
      name: noneName
    }];
    for (const [id, item] of db) {
      if (location && item.location !== location) continue;
      if (this._core.canWearItem(equipMask, item)) {
        let name = item.name;
        if (item.slots > 0) {
          name += ` [${item.slots}]`;
        }
        res.push({
          ID: id,
          name
        });
      }
    }
    res.sort((a, b) => (a.name > b.name ? 1 : -1));
    return res;
  }
}
