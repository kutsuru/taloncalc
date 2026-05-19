import { ScrollingModule } from '@angular/cdk/scrolling';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal, Signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { CardTypes, DBEnchantTypes, EQUIP_META, ItemLocations } from '../core/tt-models.v3';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TtCardSlotV3Component } from '../tt-card-slot-v3/tt-card-slot-v3.component';
import { TtEnchantSlotComponent } from '../tt-enchant-slot/tt-enchant-slot.component';
import { EquipItem } from '../tt-equip-slot/tt-equip-slot.component';
import { TtSliderComponent } from '../tt-slider/tt-slider.component';

type EquipEnchant = { type: DBEnchantTypes, itemId: number };
type PopupSide = 'bottom' | 'top' | 'right' | 'left';

@Component({
  selector: 'tt-equip-slot-popup',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    TtCardSlotV3Component,
    TtEnchantSlotComponent,
    TtSliderComponent,
    ScrollingModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './tt-equip-slot-popup.component.html',
  styleUrl: './tt-equip-slot-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEquipSlotPopupComponent implements AfterViewInit {
  /* injects */
  readonly #core = inject(TTCoreServiceV3);
  readonly #session = inject(TTSessionInfoV3Service);
  readonly #ele = inject(ElementRef);

  /* inputs */
  readonly slot = input.required<ItemLocations>();
  readonly jobItems = input.required<EquipItem[]>();
  readonly cardType = input.required<CardTypes>();

  /* outputs */
  closed = output<void>();

  /* signals */
  popupSide = signal<PopupSide>('right');
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

  /* component hooks */
  ngAfterViewInit(): void {
    const tileEl: HTMLElement = this.#ele.nativeElement.parentElement;
    const r = tileEl.getBoundingClientRect();

    const spaces: Record<PopupSide, number> = {
      bottom: window.innerHeight - r.bottom,
      top: r.top,
      right: window.innerWidth - r.right,
      left: r.left,
    };

    const best = (Object.entries(spaces) as [PopupSide, number][])
      .reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    this.popupSide.set(best);
  }

  /*** public functions ***/
  public dispRefine(val: number) {
    return `+${val}`;
  }
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
