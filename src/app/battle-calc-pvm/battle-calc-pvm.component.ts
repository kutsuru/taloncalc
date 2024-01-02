import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TTCoreService } from '../core/tt-core.service';
import { MatDialog } from '@angular/material/dialog';
import { SelectBattleTargetComponent } from '../battle-calc/select-battle-target/select-battle-target.component';
import { Ammo, Element, Mob, SessionChangeEvent, Skill } from '../core/models';
import { SkillList, TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { BattleSessionResult, TTBattleSession } from '../core/tt-battle-session';
import { Subscription, firstValueFrom } from 'rxjs';

@Component({
  selector: 'battle-calc-pvm',
  templateUrl: './battle-calc-pvm.component.html',
  styleUrl: './battle-calc-pvm.component.scss'
})
export class BattleCalcPvmComponent implements OnInit, OnDestroy {
  /* In- / Outputs */
  @Input('target') targetName: string = '';
  @Output() onClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onTargetChange: EventEmitter<string> = new EventEmitter<string>();

  public targetId: number = 1002; // Default is Poring
  public targetInfo: Mob | undefined;

  public defReduc: number = 0;
  public mdefReduc: number = 0;

  public battleResult: BattleSessionResult;

  public skillLst: SkillList = {};
  public selectedSkill: Skill | undefined;
  public selectedSkillName: string = 'Basic Attack';
  public selectedSkillLv: number = 0;

  public selectedAmmo: string | undefined;
  public selectedEndow: Element | 'none' = 'none';

  private battleSession: TTBattleSession;

  private battleSessionSub!: Subscription;
  private sessionInfoSub!: Subscription;
  private activeSkillsSub!: Subscription;

  constructor(private core: TTCoreService, private dialog: MatDialog, private session: TTSessionInfoV2Service) {
    this.battleSession = new TTBattleSession(core, session);
    this.battleResult = {
      castTime: 0,
      hitRatio: 0,
      castDelay: 0,
      minDamage: 0,
      maxDamage: 0,
      minNbHits: 0,
      maxNbHits: 0,
      critChance: 0,
      critDamage: 0,
      dodgeRatio: 0,
      battleDuration: 0,
    }
  }
  ngOnDestroy(): void {
    if (this.battleSessionSub) this.battleSessionSub.unsubscribe();
    if (this.sessionInfoSub) this.sessionInfoSub.unsubscribe();
    if (this.activeSkillsSub) this.activeSkillsSub.unsubscribe();
  }

  /* public */
  ngOnInit(): void {
    // watch for result of battle
    this.battleSessionSub = this.battleSession.result$.subscribe((res) => {
      this.battleResult = { ...res };
    });

    // watch for update of the session
    this.sessionInfoSub = this.session.sessionInfo$
      .pipe(
        this.session.eventFilterExcept(SessionChangeEvent.VANILLA_MODE)
      )
      .subscribe(async (infoMsg) => {
        /* something got changed, update the battle calc */
        // because it gets pushed with a initial value, no need to do the calcs two times

        if (infoMsg.event === SessionChangeEvent.INIT || infoMsg.event === SessionChangeEvent.CLASS) {
          /* update the skill list */
          this.skillLst = await firstValueFrom(this.session.activeSkills$);
          this.selectedSkillName = Object.keys(this.skillLst)[0];
          this.selectedSkill = this.skillLst[this.selectedSkillName];
          this.selectedSkillLv = 0;
        }
        /* update data */
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

  changeSkill(name: string) {
    this.selectedSkill = this.skillLst[name];
    // reset selected Level
    this.selectedSkillLv = 0;
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
    if (this.targetName && this.selectedSkill) {
      // TODO: make this changes checks when selection changes
      let siMsg = await firstValueFrom(this.session.sessionInfo$);
      let ammo: Ammo | undefined = undefined;
      if (this.selectedAmmo && siMsg.data.ammoType) {
        ammo = this.core.ammoDbV2[siMsg.data.ammoType][this.selectedAmmo];
      }
      let endow: Element | undefined = undefined;
      if (this.selectedEndow !== 'none') {
        endow = this.selectedEndow;
      }

      // init the sesscion class
      await this.battleSession.init(this.targetInfo!, this.selectedSkill, this.selectedSkillLv, ammo, endow);
      // TODO: start the simulation
      this.battleSession.simulate();
    }
  }
}
