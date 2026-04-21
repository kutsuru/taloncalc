import { ChangeDetectionStrategy, Component, computed, inject, input, signal, Signal } from '@angular/core';
import { MatCardAppearance, MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { EquipSlotMeta, ItemLocations } from '../core/tt-models.v3';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TTTalonURLPipe } from '../core/tt-url.pipe';
import { TtEquipSlotPopupComponent } from '../tt-equip-slot-popup/tt-equip-slot-popup.component';

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
  private readonly _session = inject(TTSessionInfoV3Service);

  /* inputs */
  readonly slot = input.required<ItemLocations>();
  readonly meta = input.required<EquipSlotMeta>();  // FIXME: maybe for name?

  /* signals */
  state = computed(() => this._session.equipment()[this.slot()]);

  /*****************************/
  itemSelected: Signal<boolean> = computed(() => {
    if (this.state().item > 0) return true;
    else return false;
  });
  appearance: Signal<MatCardAppearance> = computed(() => {
    if (this.itemSelected()) return 'raised';
    else return 'outlined';
  });
  isOpen = signal(false);

  /*** public function ***/
  toggle() {
    this.isOpen.update(_ => !_);
  }
}
