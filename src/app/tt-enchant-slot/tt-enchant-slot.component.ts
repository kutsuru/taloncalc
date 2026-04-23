import { ChangeDetectionStrategy, Component, computed, inject, input, model, Signal } from '@angular/core';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { DBEnchant, DBEnchantTypes } from '../core/tt-models.v3';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'tt-enchant-slot',
  imports: [
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './tt-enchant-slot.component.html',
  styleUrl: './tt-enchant-slot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEnchantSlotComponent {
  /* injects */
  private readonly _core = inject(TTCoreServiceV3);

  /* in- & outputs */
  variant = input.required<DBEnchantTypes>();
  value = model.required<number>();

  /* signals */
  enchants: Signal<DBEnchant[]> = computed(() => {
    const variant = this.variant();

    // FIXME: get nice name
    let res: DBEnchant[] = [{ name: `No ${variant}`, itemId: 0 }];
    if (this._core.enchantDB.has(variant)) {
      res.push(...this._core.enchantDB.get(variant)!);
    }
    return res;
  });

  /* public functions */
  enchantSelected(id: number) {
    this.value.set(id);
  }
}
