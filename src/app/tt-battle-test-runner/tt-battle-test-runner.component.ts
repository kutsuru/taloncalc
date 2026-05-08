import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { TTBattleSessionServiceV3 } from '../core/tt-battle-session.v3.service';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';

/* ------------------------------------------------------------------ */
/*  Model                                                               */
/* ------------------------------------------------------------------ */

export interface EquipSlot {
  item: number;
  cards: number[];
  enchants: number[];
  refine: number;
}

export interface TestCaseBuildData {
  jobClassName: string;
  level: { base: number; job: number };
  baseStats: { str: number; agi: number; vit: number; int: number; dex: number; luk: number };
  equip: {
    rightHand?: EquipSlot;
    leftHand?: EquipSlot;
    upperHg?: EquipSlot;
    middleHg?: EquipSlot;
    lowerHg?: EquipSlot;
    armor?: EquipSlot;
    garment?: EquipSlot;
    shoes?: EquipSlot;
    lhAccessory?: EquipSlot;
    rhAccessory?: EquipSlot;
  };
  speedPotion?: number;
}

export interface TestCase {
  id: number;
  description: string;
  buildData: TestCaseBuildData;
  monsterID: number;
  skillID: number;
  skillLevel: number;
  ammoID: number | null;
  endow: string;
  expectedMinDamage: number;
  expectedMaxDamage: number;
  tolerancePct: number;
}

export type TestStatus = 'pending' | 'running' | 'pass' | 'fail' | 'error';

export interface TestResult {
  testCase: TestCase;
  status: TestStatus;
  actualMin?: number;
  actualMax?: number;
  minDiff?: number;
  maxDiff?: number;
  minWithinTolerance?: boolean;
  maxWithinTolerance?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

@Component({
  selector: 'tt-battle-test-runner',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressBarModule,
    DecimalPipe,
    TitleCasePipe
  ],
  templateUrl: './tt-battle-test-runner.component.html',
  styleUrl: './tt-battle-test-runner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TTBattleSessionServiceV3],
})
export class TtBattleTestRunnerComponent {
  private readonly _core = inject(TTCoreServiceV3);
  readonly session = inject(TTSessionInfoV3Service);
  readonly battleSession = inject(TTBattleSessionServiceV3);

  /* signals */
  testCases = signal<TestCase[]>([]);
  results = signal<TestResult[]>([]);
  selectedIndex = signal<number | null>(null);
  isRunning = signal(false);

  /* derived */
  selectedResult = computed(() => {
    const idx = this.selectedIndex();
    return idx !== null ? this.results()[idx] : null;
  });

  passCount = computed(() => this.results().filter(r => r.status === 'pass').length);
  failCount = computed(() => this.results().filter(r => r.status === 'fail').length);
  pendingCount = computed(() => this.results().filter(r => r.status === 'pending').length);

  /* ---------------------------------------------------------------- */
  /*  File loading                                                      */
  /* ---------------------------------------------------------------- */

  loadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed: TestCase[] = JSON.parse(e.target?.result as string);
        this.testCases.set(parsed);
        this.results.set(parsed.map(tc => ({ testCase: tc, status: 'pending' })));
        this.selectedIndex.set(null);
      } catch {
        console.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  /* ---------------------------------------------------------------- */
  /*  Run logic                                                         */
  /* ---------------------------------------------------------------- */

  selectTest(index: number) {
    this.selectedIndex.set(index);
  }

  async runSelected() {
    const idx = this.selectedIndex();
    if (idx === null) return;
    await this._runTest(idx);
  }

  async runAll() {
    this.isRunning.set(true);
    for (let i = 0; i < this.testCases().length; i++) {
      this.selectedIndex.set(i);
      await this._runTest(i);
      // Small delay to allow change detection between runs
      await new Promise(r => setTimeout(r, 100));
    }
    this.isRunning.set(false);
  }

  private async _runTest(index: number) {
    const tc = this.testCases()[index];
    if (!tc) return;

    // Mark as running
    this._updateResult(index, { status: 'running' });

    try {
      // Load build into session
      this.session.applyBuild(tc.buildData);

      // Set target
      const target = this._core.mobDB.get(tc.monsterID);
      if (!target) throw new Error(`Monster ${tc.monsterID} not found`);
      this.battleSession.updateTarget(target);

      // Set skill
      this.battleSession.updateSkill(tc.skillID, tc.skillLevel);

      // Set endow
      this.battleSession.updateEndow(tc.endow === 'none' ? undefined : tc.endow as any);

      // Set ammo if needed
      if (tc.ammoID) {
        const ammoItem = this._core.itemDB.get(tc.ammoID);
        this.battleSession.updateAmmo?.(ammoItem);
      }

      // Run simulation
      this.battleSession.simulate();

      // Read results
      const actualMin = this.battleSession.minDamage();
      const actualMax = this.battleSession.maxDamage();

      const minDiff = actualMin - tc.expectedMinDamage;
      const maxDiff = actualMax - tc.expectedMaxDamage;
      const minPct = Math.abs(minDiff / tc.expectedMinDamage) * 100;
      const maxPct = Math.abs(maxDiff / tc.expectedMaxDamage) * 100;

      const minWithinTolerance = minPct <= tc.tolerancePct;
      const maxWithinTolerance = maxPct <= tc.tolerancePct;
      const status: TestStatus = minWithinTolerance && maxWithinTolerance ? 'pass' : 'fail';

      this._updateResult(index, {
        status,
        actualMin,
        actualMax,
        minDiff,
        maxDiff,
        minWithinTolerance,
        maxWithinTolerance,
      });
    } catch (err) {
      console.error(`Test ${tc.id} error:`, err);
      this._updateResult(index, { status: 'error' });
    }
  }

  private _updateResult(index: number, partial: Partial<TestResult>) {
    this.results.update(results => {
      const updated = [...results];
      updated[index] = { ...updated[index], ...partial };
      return updated;
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                           */
  /* ---------------------------------------------------------------- */

  statusIcon(status: TestStatus): string {
    switch (status) {
      case 'pass':    return 'check_circle';
      case 'fail':    return 'cancel';
      case 'running': return 'pending';
      case 'error':   return 'error';
      default:        return 'radio_button_unchecked';
    }
  }

  statusColor(status: TestStatus): string {
    switch (status) {
      case 'pass':    return 'text-green';
      case 'fail':    return 'text-red';
      case 'running': return 'text-blue';
      case 'error':   return 'text-orange';
      default:        return 'text-muted';
    }
  }

  diffLabel(diff: number | undefined): string {
    if (diff === undefined) return '-';
    return diff >= 0 ? `+${diff}` : `${diff}`;
  }
}
