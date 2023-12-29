import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TTCoreService } from '../core/tt-core.service';
import { MatDialog } from '@angular/material/dialog';
import { SelectBattleTargetComponent } from '../battle-calc/select-battle-target/select-battle-target.component';
import { Ammo, Element, Mob, SessionChangeEvent } from '../core/models';
import { TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { TTBattleSession } from '../core/tt-battle-session';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'battle-calc-pvm',
  templateUrl: './battle-calc-pvm.component.html',
  styleUrl: './battle-calc-pvm.component.scss'
})
export class BattleCalcPvmComponent implements OnInit {
  /* In- / Outputs */
  @Input('target') targetName: string = '';
  @Output() onClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onTargetChange: EventEmitter<string> = new EventEmitter<string>();

  public targetId: number = 1002; // Default is Poring
  public targetInfo: Mob | undefined;

  public defReduc: number = 0;
  public mdefReduc: number = 0;

  public selectedSkill: string = 'Basic Attack';
  public selectedSkillLv: number = 0;
  public selectedAmmo: string | undefined;
  public selectedEndow: Element | 'none' = 'none';

  private battleSession: TTBattleSession;

  constructor(private core: TTCoreService, private dialog: MatDialog, private session: TTSessionInfoV2Service) {
    this.battleSession = new TTBattleSession(core, session);
  }

  /* public */
  ngOnInit(): void {
    // watch for result of battle
    this.battleSession.result$.subscribe((res) => {
      console.log(res);
    });
    // watch for update of the session
    this.session.sessionInfo$
      .pipe(
        this.session.eventFilterExcept(SessionChangeEvent.VANILLA_MODE)
      )
      .subscribe((info) => {
        /* something got changed, update the battle calc */
        // because it gets pushed with a initial value, no need to do the calcs two times
        this.updateTargetData();
        this.updateBattleSimulation();
      });
  }

  close(): void {
    this.onClose.emit(true);
  }

  changeTarget() {
    const diaRef = this.dialog.open(SelectBattleTargetComponent);

    diaRef.afterClosed().subscribe((newTarget) => {
      if (newTarget) {
        this.onTargetChange.emit(newTarget);
        this.targetName = newTarget;
        this.updateTargetData();
        this.updateBattleSimulation();
      }
    })
  }

  /* private */
  async updateTargetData() {
    if (this.targetName) {
      this.targetInfo = this.core.mobDbV2[this.targetName];
      this.targetId = this.targetInfo.mid;

      let targetClass: 'boss' | 'normal' = this.targetInfo.mode.isBoss ? 'boss' : 'normal';

      /* calc factors */
      let mdefReducFac = this.session.getMdefReduction(targetClass, this.targetInfo.race, this.targetInfo.element);
      let defReducFac = this.session.getDefReduction(targetClass, this.targetInfo.race, this.targetInfo.element);
      // FIXME: ceil/floor usage ?
      this.defReduc = Math.ceil(
        this.targetInfo.def * (1 - defReducFac / 100)
      );
      this.mdefReduc = Math.ceil(
        this.targetInfo.mdef * (1 - mdefReducFac / 100)
      );

      // FIXME: Add def2/mdef2 as not included in mob.db
    }
  }

  private async updateBattleSimulation() {
    if (this.targetName) {
      // TODO: make this changes checks when selection changes
      let si = await firstValueFrom(this.session.sessionInfo$);
      let skill = this.core.skillDbV2[this.selectedSkill];
      let ammo: Ammo | undefined = undefined;
      if (this.selectedAmmo && si.ammoType) {
        ammo = this.core.ammoDbV2[si.ammoType][this.selectedAmmo];
      }
      let endow: Element | undefined = undefined;
      if (this.selectedEndow !== 'none') {
        endow = this.selectedEndow;
      }

      // init the sesscion class
      await this.battleSession.init(this.targetInfo!, skill, this.selectedSkillLv, ammo, endow);
      // start the simulation
      this.battleSession.simulate();
    }
  }
}
