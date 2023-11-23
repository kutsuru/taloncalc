import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { TTBattleSessionService } from '../../core/tt-battle-session.service';
import { TTCoreService } from '../../core/tt-core.service';
import { TTSessionInfoService } from '../../core/tt-session-info.service';
import { SelectBattleTargetComponent } from '../select-battle-target/select-battle-target.component';

@Component({
  selector: 'battle-calc-pvm',
  templateUrl: 'battle-calc-pvm.component.html',
  styleUrls: ['battle-calc-pvm.component.scss'],
})
export class BattleCalcPvmComponent implements OnInit, OnDestroy {
  protected minDamage: number = 0;
  protected maxDamage: number = 0;
  protected targetInfo: any = null;
  protected targetId: number = 1002; // Default to Poring ID
  protected targetClass: string = 'normal';

  protected usesAmmos: boolean = false;
  protected ammoKeys: string[] = [];
  protected ammoTypes: string[] = [];
  protected selectedEndow: string = 'none';
  protected selectedAmmo: any | null = null;
  protected currentAmmoType: string = '';
  protected endows: string[] = [
    'none',
    'water',
    'earth',
    'fire',
    'wind',
    'poison',
    'holy',
    'shadow',
    'ghost',
    'undead',
  ];

  protected skillKeys: string[] = ['Basic Attack'];
  protected skillInfo: any | null = null;
  protected selectedSkill: string = 'Basic Attack';
  protected selectedSkillLv: number = 0;
  protected selectedSkillLvs: number[] = [];

  private _jobMask: number = 0xffffff;
  private _ttBattleSession: TTBattleSessionService;

  @Output() onClose: EventEmitter<boolean> = new EventEmitter();
  @Input('target') targetName: string = '';

  constructor(
    private dialog: MatDialog,
    protected ttCore: TTCoreService,
    protected ttSessionInfo: TTSessionInfoService
  ) {
    this._ttBattleSession = new TTBattleSessionService(
      ttCore,
      ttSessionInfo
    );
  }

  ngOnInit(): void {
    this.onClassChange();
    this.updateTargetCard();
  }
  ngOnDestroy(): void {}

  close() {
    this.onClose.emit(true);
  }

  changeTarget() {
    const diaRef = this.dialog.open(SelectBattleTargetComponent);

    diaRef.afterClosed().subscribe((selectedTarget) => {
      this.targetName = selectedTarget;
      this.onClassChange();
      this.updateTargetCard();
    });
  }

  refresh(): void {
    this.onClassChange();
    this.updateTargetCard();
    this.updateBattleSimulation();
  }

  updateTargetCard(): void {
    // in case weapon changed, update ammunition information
    this.currentAmmoType = this.ttSessionInfo.sessionInfo['ammoType'];

    if (this.targetName) {
      // mode being nested won't be deep copied, which is fine as modification of mode is not allowed
      this.targetInfo = Object.assign({}, this.ttCore.mobDb[this.targetName]);

      if (this.targetInfo) {
        this.targetId = this.targetInfo['mid'];

        // Update monster def/mdef
        console.log(this.targetInfo);
        this.targetClass = this.targetInfo['mode']['isBoss']
          ? 'boss'
          : 'normal';
        let mdefReduction =
          this.ttSessionInfo.sessionInfo['activeBonus']['ignoreMdefClass'][
            'all'
          ] +
          this.ttSessionInfo.sessionInfo['activeBonus']['ignoreMdefClass'][
            this.targetClass
          ] +
          this.ttSessionInfo.sessionInfo['activeBonus']['ignoreMdefRace'][
            this.targetInfo['race']
          ] +
          this.ttSessionInfo.sessionInfo['activeBonus']['ignoreMdefElement'][
            this.targetInfo['element']
          ];

        let defReduction =
          this.ttSessionInfo.sessionInfo['activeBonus']['ignoreDefClass'][
            'all'
          ] +
          this.ttSessionInfo.sessionInfo['activeBonus']['ignoreDefClass'][
            this.targetClass
          ] +
          this.ttSessionInfo.sessionInfo['activeBonus']['ignoreDefRace'][
            this.targetInfo['race']
          ] +
          this.ttSessionInfo.sessionInfo['activeBonus']['ignoreDefElement'][
            this.targetInfo['element']
          ];

        // FIXME: ceil/floor usage ?
        this.targetInfo['def'] = Math.ceil(
          this.targetInfo['def'] * (1 - defReduction / 100)
        );
        this.targetInfo['mdef'] = Math.ceil(
          this.targetInfo['mdef'] * (1 - mdefReduction / 100)
        );

        // FIXME: Add def2/mdef2 as not included in mob.db
      }
    }
  }

  updateSkillSelection() {
    console.log('udpateSkillSelection');
    // Filter available skill in db based on job mask
    this.skillKeys = [];
    for (let key in this.ttCore.skillDb) {
      let currentSkill = this.ttCore.skillDb[key];

      let filter =
        (currentSkill['job'] & this._jobMask) == this._jobMask &&
        currentSkill['isActive'];

      if (filter) this.skillKeys.push(key);
    }
    this.skillKeys.sort((a, b) => (a > b ? 1 : -1));
    this.onSkillSelection();
  }

  onSkillSelection() {
    // Update skill level selection
    if (this.selectedSkill) {
      this.skillInfo = this.ttCore.skillDb[this.selectedSkill];

      if (this.skillInfo) {
        this.selectedSkillLvs = Array.from(
          { length: this.skillInfo['maxLevel'] },
          (_, k) => k + 1
        );
        this.selectedSkillLv = this.skillInfo['maxLevel'];
        this.updateBattleSimulation();
      }
    }
  }

  onClassChange() {
    // FIXME: Be sure that this is call upon class selection
    // Update skill selection based on new job mask
    let currentClass = this.ttSessionInfo.sessionInfo['class'];
    this._jobMask = this.ttCore.jobDb[currentClass]['mask'];
    this.updateSkillSelection();
  }

  updateBattleSimulation() {
    this._ttBattleSession.init(
      this.targetInfo,
      this.skillInfo,
      this.selectedSkillLv,
      this.selectedAmmo,
      'none' === this.selectedEndow ? '' : this.selectedEndow
    );
    let damage = this._ttBattleSession.simulate();
    if (2 == damage.length) {
      this.minDamage = damage[0];
      this.maxDamage = damage[1];
    }
  }

  onAmmoTypeUpdate() {
    this.ttCore.ammoDb[this.currentAmmoType];
  }
}
