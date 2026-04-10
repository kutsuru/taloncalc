import { ChangeDetectionStrategy, Component, computed, inject, input, Signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { CardTypes, DBItem, EquipItemFilter, EquipSlotMeta, ItemLocations } from '../core/tt-models.v3';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { getCardTypeForEquipLocation } from '../core/utils';
import { TtCardSlotV3Component } from '../tt-card-slot-v3/tt-card-slot-v3.component';

type EquipItem = Pick<DBItem, 'ID' | 'name'>;

@Component({
  selector: 'tt-equip-slot',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    TtCardSlotV3Component
  ],
  templateUrl: './tt-equip-slot.component.html',
  styleUrl: './tt-equip-slot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEquipSlotComponent {
  /* injects */
  private readonly _session = inject(TTSessionInfoV3Service);
  private readonly _core = inject(TTCoreServiceV3);

  /* inputs */
  readonly slot = input.required<ItemLocations>();
  readonly meta = input.required<EquipSlotMeta>();

  /* varbs */
  state = computed(() => this._session.equipment()[this.slot()]);
  allSlotItems: Signal<DBItem[]> = computed(() => {
    /* triggers */
    const isLoaded = this._core.$loaded();
    const iFilter = this.itemFilter();

    if (!isLoaded) return [];

    const res: DBItem[] = [];
    for (const [id, item] of this._core.itemDB) {
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
    const job = this._session.jobClass();
    const items = this.allSlotItems();
    const meta = this.meta();

    let jobMask = 0xfffffff;
    if (job) jobMask = Number(job.mask);

    const res: EquipItem[] = [{ ID: 0, name: `(No ${meta.label})` }];
    for (const item of items) {
      if (this._core.canWearItem(jobMask, item)) {
        let name = item.name;
        if (item.slots > 0) name += ` [${item.slots}]`;
        res.push({ ID: item.ID, name });
      }
    }

    res.sort((a, b) => (a.name > b.name ? 1 : -1));

    return res;
  });
  itemFilter = computed(() => {
    const meta = this.meta();
    const slot = this.slot();

    if (slot === 'rightHand') {
      const rightHandType = this._session.rightHandType();
      if (rightHandType !== 'Unarmed') {
        return { type: 'weapon', weaponType: rightHandType } as EquipItemFilter;
      }
      else {
        return { type: 'none' } as EquipItemFilter;
      }
    }
    else if (slot === 'leftHand') {
      const leftHandType = this._session.leftHandType();
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
  readonly maxRefines = Array.from({ length: 10 + 1 }, (_, i) => i);

  /*** public functions ***/
  public changeItem(id: number) {
    this._session.updateEquipmentId(this.slot(), id);
  }
  public changeRefine(refine: number) {
    this._session.updateEquipment(this.slot(), { refine });
  }
  public changeCard(cardSlot, cardId: number) {
    this._session.updateCard(this.slot(), cardId, cardSlot);
  }
}
