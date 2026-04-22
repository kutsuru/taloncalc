import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal, Signal } from '@angular/core';
import { MatCardAppearance, MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { EQUIP_META, ItemLocations, EquipItemFilter, DBItem, CardTypes } from '../core/tt-models.v3';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TTTalonURLPipe } from '../core/tt-url.pipe';
import { TtEquipSlotPopupComponent } from '../tt-equip-slot-popup/tt-equip-slot-popup.component';
import { getCardTypeForEquipLocation } from '../core/utils';

export type EquipItem = Pick<DBItem, 'ID' | 'name'>;

@Component({
  selector: 'tt-equip-slot',
  imports: [
    MatCardModule,
    TTTalonURLPipe,
    TtEquipSlotPopupComponent,
    MatRippleModule
  ],
  templateUrl: './tt-equip-slot.component.html',
  styleUrl: './tt-equip-slot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEquipSlotComponent {
  /* injects */
  readonly #session = inject(TTSessionInfoV3Service);
  readonly #core = inject(TTCoreServiceV3);

  /* inputs */
  readonly slot = input.required<ItemLocations>();
  readonly disabled = model<boolean>(false);

  /* signals */
  meta = computed(() => EQUIP_META[this.slot()]);
  state = computed(() => this.#session.equipment()[this.slot()]);
  itemSelected: Signal<boolean> = computed(() => {
    if (this.state().item > 0) return true;
    else return false;
  });
  appearance: Signal<MatCardAppearance> = computed(() => {
    if (this.itemSelected()) return 'raised';
    else return 'outlined';
  });
  isOpen = signal(false);

  /**
   * signals for popup
   * we create them in this component, because the IF is creating the component "live" 
   * and this will cause a big delay because of item filtering
   */
  itemFilter = computed(() => {
    const meta = this.meta();
    const slot = this.slot();

    if (slot === 'rightHand') {
      const rightHandType = this.#session.rightHandType();
      if (rightHandType !== 'Unarmed') {
        return { type: 'weapon', weaponType: rightHandType } as EquipItemFilter;
      }
      else {
        return { type: 'none' } as EquipItemFilter;
      }
    }
    else if (slot === 'leftHand') {
      const leftHandType = this.#session.leftHandType();
      if (leftHandType === 'Shield') {
        return { type: 'equip', location: 'Shield' } as EquipItemFilter;
      }
      else if (leftHandType !== 'Unarmed') {
        return { type: 'weapon', weaponType: leftHandType } as EquipItemFilter;
      }
      else {
        return { type: 'none' } as EquipItemFilter;
      }
    }
    else {
      return meta.defaultFilter;
    }
  });
  allSlotItems: Signal<DBItem[]> = computed(() => {
    /* triggers */
    const isLoaded = this.#core.$loaded();
    const iFilter = this.itemFilter();

    if (!isLoaded) return [];

    const res: DBItem[] = [];
    for (const [id, item] of this.#core.itemDB) {
      if (iFilter.type === 'equip' && item.location === iFilter.location) {
        res.push(item);
      }
      else if (iFilter.type === 'weapon' && item.subType === iFilter.weaponType) {
        res.push(item);
      }
    }

    return res;
  });
  jobItems: Signal<EquipItem[]> = computed(() => {
    const job = this.#session.jobClass();
    const items = this.allSlotItems();
    const meta = this.meta();

    let jobMask = 0xfffffff;
    if (job) jobMask = Number(job.mask);

    const res: EquipItem[] = [{ ID: 0, name: `(No ${meta.label})` }];
    for (const item of items) {
      if (this.#core.canWearItem(jobMask, item)) {
        let name = item.name;
        if (item.slots > 0) name += ` [${item.slots}]`;
        res.push({ ID: item.ID, name });
      }
    }

    res.sort((a, b) => (a.name > b.name ? 1 : -1));

    return res;
  });
  cardType: Signal<CardTypes> = computed(() => {
    const iFilter = this.itemFilter();
    if (iFilter.type === 'weapon') {
      return 'Weapon';
    }
    else if (iFilter.type === 'equip') {
      return getCardTypeForEquipLocation(iFilter.location);
    }
    return 'Armor'; // just a value
  });

  /*** public function ***/
  toggle() {
    if (!this.disabled()) this.isOpen.update(_ => !_);
  }
}
