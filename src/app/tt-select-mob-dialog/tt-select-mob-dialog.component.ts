import { MatCard } from '@angular/material/card';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

type SortKey = 'name' | 'mid' | 'hp' | 'def' | 'mdef' | 'minAtk' | 'race' | 'element' | 'size';

interface SortColumn {
  key: SortKey;
  label: string;
}

@Component({
  selector: 'tt-select-mob-dialog',
  imports: [
    MatCard,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    DecimalPipe,
    TitleCasePipe,
    ScrollingModule,
  ],
  templateUrl: './tt-select-mob-dialog.component.html',
  styleUrl: './tt-select-mob-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TtSelectMobDialogComponent {
  private readonly _core = inject(TTCoreServiceV3);

  /* form */
  selectedMob = new FormControl<number | null>(null);
  searchControl = new FormControl('');

  /* sort */
  sortKey = signal<SortKey>('name');
  sortAsc = signal(true);

  sortColumns: SortColumn[] = [
    { key: 'name',    label: 'Name'    },
    { key: 'mid',     label: 'ID'      },
    { key: 'hp',      label: 'HP'      },
    { key: 'def',     label: 'DEF'     },
    { key: 'mdef',    label: 'MDEF'    },
    { key: 'minAtk',  label: 'ATK'     },
    { key: 'race',    label: 'Race'    },
    { key: 'element', label: 'Element' },
    { key: 'size',    label: 'Size'    },
  ];

  /* search input as signal */
  private searchValue = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  /* all mobs from DB */
  private mobsAll = computed(() => {
    this._core.$loaded();
    return [...this._core.mobDB.values()];
  });

  /* filtered + sorted list */
  filteredMobs = computed(() => {
    const search = (this.searchValue() ?? '').toLowerCase().trim();
    const key = this.sortKey();
    const asc = this.sortAsc();

    let list = this.mobsAll();

    if (search) {
      list = list.filter(mob =>
        mob.name.toLowerCase().includes(search) ||
        mob.mid.toString().includes(search)
      );
    }

    return [...list].sort((a, b) => {
      const av = a[key as keyof typeof a];
      const bv = b[key as keyof typeof b];
      if (typeof av === 'string' && typeof bv === 'string') {
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return asc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  });

  setSort(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortKey.set(key);
      this.sortAsc.set(true);
    }
  }

  trackByMid(_: number, mob: any) {
    return mob.mid;
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }

  // FIXME: Use pipe instead?
  formatNumber(value: number): string {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return value.toString();
  }
}
