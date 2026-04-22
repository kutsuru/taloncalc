import { ChangeDetectionStrategy, Component, computed, inject, input, output, Signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { CardTypes, DBEnchantTypes, DBItem, EQUIP_META, EquipItemFilter, EquipSlotMeta, ItemLocations } from '../core/tt-models.v3';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';

import { TtCardSlotV3Component } from '../tt-card-slot-v3/tt-card-slot-v3.component';
import { TtEnchantSlotComponent } from '../tt-enchant-slot/tt-enchant-slot.component';
import { EquipItem } from '../tt-equip-slot/tt-equip-slot.component';

type EquipEnchant = { type: DBEnchantTypes, itemId: number };

@Component({
  selector: 'tt-equip-slot-popup',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    TtCardSlotV3Component,
    TtEnchantSlotComponent
  ],
  templateUrl: './tt-equip-slot-popup.component.html',
  styleUrl: './tt-equip-slot-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEquipSlotPopupComponent {
  /* injects */
  readonly #core = inject(TTCoreServiceV3);
  readonly #session = inject(TTSessionInfoV3Service);

  /* inputs */
  readonly slot = input.required<ItemLocations>();
  readonly jobItems = input.required<EquipItem[]>();
  readonly cardType = input.required<CardTypes>();

  /* outputs */
  closed = output<void>();

  /* varbs */
  readonly maxRefines = Array.from({ length: 10 + 1 }, (_, i) => i);

  /* signals */
  meta = computed(() => EQUIP_META[this.slot()]);
  state = computed(() => this.#session.equipment()[this.slot()]);
  enchants: Signal<EquipEnchant[]> = computed(() => {
    const state = this.state();
    const item = this.#core.itemDB.get(state.item);
    if (!item || !item.enchant) return [];

    const res: EquipEnchant[] = [];
    for (let i = 0; i < item.enchant.length; i++) {
      res.push({
        itemId: state.enchants[i],
        type: item.enchant[i]
      });
    }
    return res;
  });

  /*** public functions ***/
  public changeItem(id: number) {
    this.#session.updateEquipmentId(this.slot(), id);
  }
  public changeRefine(refine: number) {
    this.#session.updateEquipment(this.slot(), { refine });
  }
  public changeCard(cardSlot: number, cardId: number) {
    this.#session.updateCard(this.slot(), cardId, cardSlot);
  }
  public changeEnchant(enchantSlot: number, enchantId: number) {
    this.#session.updateEnchant(this.slot(), enchantSlot, enchantId);
  }
}
