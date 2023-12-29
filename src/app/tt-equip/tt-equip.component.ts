import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CardLocations, Item, ItemLocations, JobDbEntry, SessionCard, SessionChangeEvent, SessionEquip, SessionEquipBase, VANILLA_MODES, VanillaMode, WeaponType, WeaponTypeLeft } from '../core/models';
import { TTSessionInfoV2Service } from '../core/tt-session-info_v2.service';
import { TTCoreService } from '../core/tt-core.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'tt-equip',
  templateUrl: './tt-equip.component.html',
  styleUrls: ['./tt-equip.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtEquipComponent implements OnInit {
  /* general */
  vanillaModes = Array.from(VANILLA_MODES);
  vanillaMode = new FormControl<VanillaMode>('Unrestricted');

  /* session info data */
  jobClass: JobDbEntry | undefined;
  compatibleLeftHandTypes: WeaponTypeLeft[] = [];
  equipMask: number = 0xfffffff;

  /* gear data */
  readonly maxRefine: number = 10;
  readonly maxRefines = Array.from({ length: this.maxRefine + 1 }, (_, i) => i);
  upperHgs: string[] = [];
  middleHgs: string[] = [];
  lowerHgs: string[] = [];
  armors: string[] = [];
  weapons: string[] = [];
  leftHands: string[] = []; // Shield or Weapon (for Assa)
  garments: string[] = [];
  shoes: string[] = [];
  accessories: string[] = [];

  /* gear values */
  gears: SessionEquip = {
    armor: '',
    garment: '',
    leftHand: '',
    leftHandType: 'Unarmed',
    rightHandType: 'Unarmed',
    lhAccessory: '',
    lowerHg: '',
    middleHg: '',
    rhAccessory: '',
    rightHand: '',
    shoes: '',
    upperHg: ''
  }
  cards: SessionCard = {
    armor: '',
    garment: '',
    leftHand: [],
    lhAccessory: '',
    middleHg: '',
    rhAccessory: '',
    rightHand: [],
    shoes: '',
    upperHg: ''
  }
  leftHandCardLocation: CardLocations = 'shield';

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
          SessionChangeEvent.EQUIP,
          SessionChangeEvent.REFINE,
          SessionChangeEvent.CARD
        )
      )
      .subscribe((info) => {
        this.jobClass = this.sessionInfo.jobClass;

        /* set refines */
        this.refines = { ...info.refine };
        /* set gears */
        this.gears = { ...info.equip }
        /* set cards */
        this.cards = {
          armor: info.card.armor,
          garment: info.card.garment,
          lhAccessory: info.card.lhAccessory,
          middleHg: info.card.middleHg,
          rhAccessory: info.card.rhAccessory,
          shoes: info.card.shoes,
          upperHg: info.card.upperHg,
          leftHand: Object.assign([], info.card.leftHand),
          rightHand: Object.assign([], info.card.rightHand)
        }
        /* other stuff */
        this.vanillaMode.patchValue(info.vanillaMode);
        /* update gears, but only when job class has changed*/
        if (this.jobClass) {
          if (Number(this.jobClass.mask) != this.equipMask) {
            this.equipMask = Number(this.jobClass.mask);
            this.updateEquipData();
          }
        }
      });
  }

  /* public function */
  public changeRefine(equip: ItemLocations, refine: number) {
    this.sessionInfo.changeRefine(equip, refine);
  }

  public changeEquip(equipLocation: keyof SessionEquip, equip: string | WeaponType) {
    this.sessionInfo.changeEquip(equipLocation, equip);
  }

  public changeLeftHandType(newType: WeaponType) {
    this.gears.leftHandType = newType;
    this.updateLeftHandData(true);
    this.changeEquip('leftHandType', newType);
  }
  // weapon == Right Hand
  public changeWeaponType(newType: WeaponType) {
    this.gears.rightHandType = newType;
    this.updateWeaponData(true);
    this.changeEquip('rightHandType', newType);
  }

  public changeVanillaMode(mode: VanillaMode) {
    this.sessionInfo.changeVanillaMode(mode);
  }
  public changeCard(cardLocation: keyof SessionCard, card: string, slot?: number){
    this.sessionInfo.changeCard(cardLocation, card, slot);
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
    /* armor */
    this.armors = this.filterGear(this.core.armorDbV2);
    /* weapons */
    this.updateWeaponData();
    /* left hand (shield or weapon) */
    this.updateLeftHandData();
    /* garments */
    this.garments = this.filterGear(this.core.garmentDbV2);
    /* shoes */
    this.shoes = this.filterGear(this.core.shoesDbV2);
    /* accessories */
    this.accessories = this.filterGear(this.core.accessoryDbV2);

    /* update dom */
    // this.ref.markForCheck();
  }

  private updateWeaponData(publish: boolean = false) {
    this.weapons = this.filterGear(this.core.weaponDbV2[this.gears.rightHandType]);
    // TODO: Update to first value in list
    // if (publish) this.ref.markForCheck();
  }

  private updateLeftHandData(publish: boolean = false) {
    if (this.gears.leftHandType === 'Shield') {
      this.leftHands = this.filterGear(this.core.shieldDbV2);
      this.leftHandCardLocation = 'shield';
    }
    else {
      this.leftHands = this.filterGear(this.core.weaponDbV2[this.gears.leftHandType]);
      this.leftHandCardLocation = 'weapon';
    }
    // TODO: Update to first value in list
    // if (publish) this.ref.markForCheck();
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
