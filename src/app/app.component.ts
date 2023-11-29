import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { TTCoreService } from './core/tt-core.service';
import { TTSessionInfoService } from './core/tt-session-info.service';
import { TtPageLoaderService } from './tt-page-loader/tt-page-loader.service';
import { TtPopupGroupComponent } from './tt-popup/tt-popup-group.component';
import { TtSettingsService } from './tt-settings/tt-settings.service';
import { TTThemerService } from './tt-themer/tt-themer.service';
import { TTSessionInfoV2Service } from './core/tt-session-info_v2.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  longText = `Fixme`;

  debugMsg = '....';

  isTwoHanded: boolean = false;
  hasJobLvLimit: boolean = false;
  filterEquipment: boolean = true;
  isBabyClassChecked: boolean = false;

  weaponType: string = '';
  selectedClassName: string = '';
  leftHandSelectorName: string = 'Shield';

  selectedClass: any | null = null;
  selectedShoes: any | null = null;
  selectedArmor: any | null = null;
  selectedWeapon: any | null = null;
  selectedUpperHg: any | null = null;
  selectedLowerHg: any | null = null;
  selectedGarment: any | null = null;
  selectedLeftHand: any | null = null;
  selectedMiddleHg: any | null = null;
  selectedRHAccessory: any | null = null;
  selectedLHAccessory: any | null = null;

  compatibleWeaponTypes: string[] = [];
  compatibleLeftHandTypes: string[] = [];
  vanillaMode = ['Unrestricted', 'PvM Vanilla', 'PvP Vanilla'];

  leftHandSlots: number = 0;
  rightHandSlots: number = 0;

  strBonus: number = 0;
  agiBonus: number = 0;
  vitBonus: number = 0;
  intBonus: number = 0;
  dexBonus: number = 0;
  lukBonus: number = 0;
  maxJobLv: number = 99;
  equipmentMask: number = 0xfffffff;

  maxStat: number = 99;
  maxRefine: number = 10;
  maxStats: number[] = Array.from({ length: this.maxStat }, (_, i) => i + 1);
  maxRefines: number[] = Array.from(
    { length: this.maxRefine + 1 },
    (_, i) => i
  );

  protected classKeys: string[] | null;
  protected armorKeys: string[] | null;
  protected shoesKeys: string[] | null;
  protected weaponKeys: string[] | null;
  protected garmentKeys: string[] | null;
  protected upperHgKeys: string[] | null;
  protected lowerHgKeys: string[] | null;
  protected leftHandKeys: string[] | null;
  protected middleHgKeys: string[] | null;
  protected accessoryKeys: string[] | null;
  protected aspdPotionKeys: string[] | null;

  private settingsPopupSub!: Subscription;
  @ViewChild(TtPopupGroupComponent) popupGroup!: TtPopupGroupComponent;
  constructor(
    public themer: TTThemerService,
    protected ttCore: TTCoreService,
    protected ttSessionInfoService: TTSessionInfoService,
    private ttLoaderService: TtPageLoaderService,
    protected ttSettings: TtSettingsService,
    private session: TTSessionInfoV2Service
  ) {
    this.classKeys = ['Novice'];
    this.armorKeys = null;
    this.shoesKeys = null;
    this.weaponKeys = null;
    this.garmentKeys = null;
    this.upperHgKeys = null;
    this.lowerHgKeys = null;
    this.middleHgKeys = null;
    this.leftHandKeys = null;
    this.accessoryKeys = null;
    this.aspdPotionKeys = null;
  }

  ngOnDestroy(): void {
    this.settingsPopupSub.unsubscribe();
  }

  ngOnInit() {
    this.ttCore.initializeCore().subscribe((_) => {
      this.initClassSelection();
    });

    this.settingsPopupSub = this.ttSettings.popupChanged$.subscribe((val) => {
      console.log('close popups');
      /* close all popups */
      this.popupGroup.closeAll();
      console.log(this.popupGroup);
    })
  }

  initClassSelection() {
    this.classKeys = this.filterKeys(
      this.ttCore.jobDb,
      this.isBabyClassChecked ? (o: any, v: number) => !o['isTrans'] : null,
      0
    );

    // In case trans class was selected and baby class is activated
    // FIXME? Reset existing filtering on class
    this.onClassChange();
  }

  debug() {
    // this.debugMsg = 'Start Loading Core Service...';
    // this.ttLoaderService.enable();
    // this.ttCore.initializeCore().subscribe((_) => {
    //   this.debugMsg = 'Service loaded';
    //   this.ttLoaderService.disable();
    //   this.initClassSelection();
    // });
    this.session.changeEquip('armor', 'Aegir Armor');
  }

  updateEquipmentList() {
    this.updateDefensiveEquipmentList();

    this.weaponKeys = this.filterKeys(
      this.ttCore.weaponDb[this.weaponType],
      this.maskFilter,
      this.equipmentMask,
      true
    );

    this.leftHandKeys = this.filterKeys(
      'Shield' == this.leftHandSelectorName
        ? this.ttCore.shieldDb
        : this.ttCore.weaponDb[
        this.ttSessionInfoService.sessionInfo['equip']['leftHandType']
        ],
      this.maskFilter,
      this.equipmentMask,
      true
    );
  }

  updateDefensiveEquipmentList() {
    this.lowerHgKeys = this.filterKeys(
      this.ttCore.headgearDb['Lower'],
      this.maskFilter,
      this.equipmentMask,
      true
    );
    this.middleHgKeys = this.filterKeys(
      this.ttCore.headgearDb['Middle'],
      this.maskFilter,
      this.equipmentMask,
      true
    );
    this.upperHgKeys = this.filterKeys(
      this.ttCore.headgearDb['Upper'],
      this.maskFilter,
      this.equipmentMask,
      true
    );
    this.armorKeys = this.filterKeys(
      this.ttCore.armorDb,
      this.maskFilter,
      this.equipmentMask,
      true
    );
    this.garmentKeys = this.filterKeys(
      this.ttCore.garmentDb,
      this.maskFilter,
      this.equipmentMask,
      true
    );
    this.shoesKeys = this.filterKeys(
      this.ttCore.shoesDb,
      this.maskFilter,
      this.equipmentMask,
      true
    );
    this.accessoryKeys = this.filterKeys(
      this.ttCore.accessoryDb,
      this.maskFilter,
      this.equipmentMask,
      true
    );
  }

  onClassChange(): void {
    // Update passive/active class skills
    this.ttSessionInfoService.onClassChange();

    // Update stats information (including job stats bonus)
    this.ttSessionInfoService.updateSessionInfo();

    // Update view content
    if (this.ttSessionInfoService.jobInfo) {
      // Update max job level
      this.maxJobLv = this.ttSessionInfoService.jobInfo['maxJobLv'];
      this.hasJobLvLimit = this.maxJobLv < this.maxStat;

      // Update compatible weapon types
      this.compatibleWeaponTypes =
        this.ttSessionInfoService.jobInfo['compatibleWeapons'];

      // Update compatible left hand types
      // Only assassin class can dual wield
      // FIXME remove two handed weapon, update filterKey to take a function as input
      if (this.ttSessionInfoService.sessionInfo['class'].includes('Assassin')) {
        this.compatibleLeftHandTypes = this.compatibleWeaponTypes.concat([]);
        this.compatibleLeftHandTypes.push('Shield');
      } else this.compatibleLeftHandTypes = ['Unarmed', 'Shield'];

      // Update class equipment mask and filter all dbs
      this.equipmentMask = Number(this.ttSessionInfoService.jobInfo['mask']);

      this.updateDefensiveEquipmentList();

      this.aspdPotionKeys = this.filterKeys(
        this.ttCore.foodDb['Aspd Potion'],
        this.maskFilter,
        this.equipmentMask,
        false,
        false
      );
    }
  }

  onLeftHandTypeChange(event: MatSelectChange): void {
    this.leftHandSelectorName = event.value;
    this.leftHandKeys = this.filterKeys(
      'Shield' == event.value
        ? this.ttCore.shieldDb
        : this.ttCore.weaponDb[
        this.ttSessionInfoService.sessionInfo['equip']['leftHandType']
        ],
      this.maskFilter,
      this.equipmentMask,
      true
    );

    if (
      this.leftHandSelectorName === 'Shield' ||
      this.leftHandSelectorName === 'Unarmed'
    )
      this.ttSessionInfoService.isDualWielding = false;
    else this.ttSessionInfoService.isDualWielding = true;

    if (this.leftHandKeys.length)
      this.ttSessionInfoService.sessionInfo['equip']['leftHand'] =
        this.leftHandKeys[0];
    // FIXME trigger OnSelection event

    this.ttSessionInfoService.updateSessionInfo();
  }

  onWeaponTypeChange(event: MatSelectChange): void {
    // Update weapon type used to filter data out of weapon database
    this.weaponType = event.value;

    let selectedWeaponType: any = this.ttCore.weaponTypeDb[this.weaponType];
    // Update dual wielding status to hide automatically left hand related components
    this.isTwoHanded = selectedWeaponType['isTwoHanded'];

    // Update ammo type information

    let ammoType: string = '';
    if ('ammoType' in selectedWeaponType)
      ammoType = selectedWeaponType['ammoType'];
    this.ttSessionInfoService.sessionInfo['ammoType'] = ammoType;

    // Reset left hand information
    if (this.isTwoHanded) {
      this.ttSessionInfoService.sessionInfo['equip']['leftHandType'] =
        'Unarmed';
      this.ttSessionInfoService.sessionInfo['equip']['leftHand'] = 'Unarmed';
    }

    this.weaponKeys = this.filterKeys(
      this.ttCore.weaponDb[this.weaponType],
      this.maskFilter,
      this.equipmentMask,
      true
    );

    if (this.weaponKeys.length)
      this.ttSessionInfoService.sessionInfo['equip']['rightHand'] =
        this.weaponKeys[0];
    // FIXME trigger OnSelection event

    this.ttSessionInfoService.updateSessionInfo();
  }

  onEquipChange(event: MatSelectChange): void {
    // Update bonus scripts
    this.updateEquipBonus();
    // Equipment bonus should not be mixed with enchant and card bonus, due to Improve Concentration ignoring DEX and AGI from enchants and cards
  }

  onAspdPotionChange(): void {
    // Update bonus scripts
    let selectedPotion: string =
      this.ttSessionInfoService.sessionInfo['aspdPotion'];

    // Reset scAspdPotion
    this.ttSessionInfoService.sessionInfo['activeStatus']['scAspdPotion'] = 0;

    // Retrieve asdp bonus from db
    // FIXME: Move this part to session info?
    if (selectedPotion != 'None') {
      let aspdBonus: string =
        this.ttCore.foodDb['Aspd Potion'][selectedPotion]['bonus'];
      eval(aspdBonus)(this.ttSessionInfoService.sessionInfo['activeStatus']);
    }

    // FIXME restrict to asdp and combat simulation update
    this.ttSessionInfoService.updateSessionInfo();
  }

  onWeaponChange(event: MatSelectChange): void {
    this.selectedWeapon = this.ttCore.weaponDb[this.weaponType][event.value];

    let slotDifference: number = Math.max(
      0,
      this.rightHandSlots - this.selectedWeapon['slots']
    );
    this.rightHandSlots = this.selectedWeapon['slots'];

    // Reinitialize unused slots
    for (
      let i: number = this.rightHandSlots + slotDifference - 1;
      i >= this.rightHandSlots;
      --i
    )
      this.ttSessionInfoService.sessionInfo['card']['rightHand'][i] = '';

    console.log(this.ttSessionInfoService.sessionInfo['card']['rightHand']);
    // Update bonus scripts
    this.updateEquipBonus();
  }
  onGarmentChange(event: MatSelectChange): void {
    this.selectedGarment = event.value;
    // Update bonus scripts
    this.updateEquipBonus();
  }
  onShoesChange(event: MatSelectChange): void {
    this.selectedShoes = event.value;
    // Update bonus scripts
    this.updateEquipBonus();
  }
  onUpperHgChange(event: MatSelectChange): void {
    this.selectedUpperHg = event.value;
    // Update bonus scripts
    this.updateEquipBonus();
  }
  onMiddleHgChange(event: MatSelectChange): void {
    this.selectedUpperHg = event.value;
    // Update bonus scripts
    this.updateEquipBonus();
  }
  onLowerHgChange(event: MatSelectChange): void {
    this.selectedUpperHg = event.value;
    // Update bonus scripts
    this.updateEquipBonus();
  }
  onArmorChange(event: MatSelectChange): void {
    this.selectedArmor = event.value;
    // Update bonus scripts
    this.updateEquipBonus();
  }
  onLeftHandChange(event: MatSelectChange): void {
    if ('Shield' === this.leftHandSelectorName)
      this.selectedLeftHand = this.ttCore.shieldDb[event.value];
    else
      this.selectedLeftHand =
        this.ttCore.weaponDb[this.leftHandSelectorName][event.value];

    let slotDifference: number = Math.max(
      0,
      this.leftHandSlots - this.selectedLeftHand['slots']
    );
    this.leftHandSlots = this.selectedLeftHand['slots'];

    // Reinitialize unused slots
    for (
      let i: number = this.leftHandSlots + slotDifference - 1;
      i >= this.leftHandSlots;
      --i
    )
      this.ttSessionInfoService.sessionInfo['card']['leftHand'][i] = '';

    console.log(this.ttSessionInfoService.sessionInfo['card']['leftHand']);

    // Update bonus scripts
    this.updateEquipBonus();
  }
  onLHAccessoryChange(event: MatSelectChange): void {
    this.selectedLHAccessory = event.value;
    // Update bonus scripts
    this.updateEquipBonus();
  }
  onRHAccessoryChange(event: MatSelectChange): void {
    this.selectedRHAccessory = event.value;
    // Update bonus scripts
    this.updateEquipBonus();
  }

  updateEquipBonus(): void {
    // Update bonus scripts
    this.ttSessionInfoService.updateSessionInfo();
  }

  onJobLvChange(event: MatSelectChange): void {
    this.ttSessionInfoService.updateSessionInfo();
  }

  onBaseLvChange(event: MatSelectChange): void {
    this.ttSessionInfoService.updateSessionInfo();
  }

  onStatChange(event: MatSelectChange): void {
    this.ttSessionInfoService.updateSessionInfo();
  }

  maskFilter = (
    obj: any,
    mask: number,
    vanillaCheck: boolean = false
  ): boolean => {
    let result: boolean = (obj['job'] & mask) == mask;
    if (vanillaCheck) {
      let vanillaMode: string =
        this.ttSessionInfoService.sessionInfo['vanillaMode'];
      if ('PvM Vanilla' === vanillaMode) result = result && obj['isVanillaPvm'];
      else if ('PvP Vanilla' === vanillaMode)
        result = result && obj['isVanillaPvp'];
    }
    return result;
  };

  filterKeys = (
    input: any,
    filter: Function | null,
    valueFilter: number,
    vanillaFlag: boolean = false,
    sort: boolean = true
  ): string[] => {
    let keys = [];
    if (input) {
      for (let key in input)
        if (!filter || filter(input[key], valueFilter, vanillaFlag))
          keys.push(key);

      if (sort) keys.sort((a, b) => (a > b ? 1 : -1));
    }

    return keys;
  };
}