import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Item, ItemLocations, JobDbEntry, SessionChangeEvent, SessionEquip, SessionEquipBase, SessionInfoV2, VANILLA_MODES, WeaponType, WeaponTypeLeft } from '../core/models';
import { TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { MatLegacySelectChange as MatSelectChange } from '@angular/material/legacy-select';
import { TTCoreService } from '../core/tt-core.service';

@Component({
  selector: 'tt-equip',
  templateUrl: './tt-equip.component.html',
  styleUrls: ['./tt-equip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEquipComponent implements OnInit {
  /* general */
  vanillaModes = Array.from(VANILLA_MODES);

  /* session info data */
  jobClass: JobDbEntry | undefined;
  weaponTypeInit: WeaponType = 'Unarmed';  // TODO: only for init value currently?
  compatibleLeftHandTypes: WeaponTypeLeft[] = [];
  equipMask: number = 0xfffffff;

  /* gear data */
  readonly maxRefine: number = 10;
  readonly maxRefines = Array.from({ length: this.maxRefine + 1 }, (_, i) => i);
  upperHgs: string[] = [];
  middleHgs: string[] = [];
  lowerHgs: string[] = [];
  /* refines */
  refines: SessionEquipBase<number> = {
    armor: 0,
    garment: 0,
    leftHand: 0,
    lhAccessory: 0,
    lowerHg: 0,
    middleHg: 0,
    rhAccessory: 0,
    rightHand: 0,
    shoes: 0,
    upperHg: 0
  }

  /* etc?? */

  constructor(private sessionInfo: TTSessionInfoV2Service, private ref: ChangeDetectorRef, private core: TTCoreService) { }

  /* component functions */
  ngOnInit(): void {
    this.sessionInfo.sessionInfo$
      .pipe(
        this.sessionInfo.eventFilter(
          SessionChangeEvent.INIT,
          SessionChangeEvent.CLASS,
          SessionChangeEvent.EQUIP
        )
      )
      .subscribe((info) => {
        this.jobClass = this.sessionInfo.jobClass;
        
        /* set refines */
        this.refines = { ...info.refine };
        /* set gears */
        // TODO
        /* update gears, but only when job class has changed*/
        if (Number(this.jobClass.mask) != this.equipMask) {
          this.equipMask = Number(this.jobClass.mask);
          this.updateEquipData();
        }
      });
  }

  /* public function */
  public changeRefine(equip: ItemLocations, refine: number) {
    this.sessionInfo.changeRefine(equip, refine);
  }
  public changeEquip(equipLocation: keyof SessionEquip, equip: string | WeaponType){
    this.sessionInfo.changeEquip(equipLocation, equip);
  }

  /* private functions */
  private updateEquipData() {
    /* left hand weapon type */
    if (this.sessionInfo.jobClassName && this.sessionInfo.jobClassName.includes('Assassin')) {
      this.compatibleLeftHandTypes = this.jobClass!.compatibleWeapons.concat([]);
      this.compatibleLeftHandTypes.push("Shield");
    }
    else {
      this.compatibleLeftHandTypes = ["Unarmed", "Shield"];
    }

    /* headgears */
    this.upperHgs = this.filterGear(this.core.headgearDbV2.Upper);
    this.middleHgs = this.filterGear(this.core.headgearDbV2.Middle);
    this.lowerHgs = this.filterGear(this.core.headgearDbV2.Lower);

    /* update dom */
    this.ref.markForCheck();
  }

  private filterGear(data: { [key: string]: Item }): string[] {
    let res: string[] = [];

    for (let dataKey in data) {
      /* filter by mask */
      let curEquipMask = Number(data[dataKey].job);
      if ((curEquipMask & this.equipMask) == this.equipMask) {
        res.push(dataKey);
      }
    }
    res.sort((a, b) => (a > b ? 1 : -1));

    return res;
  }
}
