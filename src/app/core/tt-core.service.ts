import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, forkJoin, Observable, of, retry } from 'rxjs';
import { JsonDbService } from './json-db.service';
import { Armor, ArmorDB_V2, CardDB_V2, DictDb, FoodDB_V2, HeadgearDB_V2, ItemDB, JobDB, JobDB_V2, NestedDictDb, SkillDB_V2, WeaponDB_V2 } from './models';

@Injectable({
  providedIn: 'root',
})
export class TTCoreService {
  /* statics */
  static MAX_LVL: number = 99;

  /* databases */
  private _mobDb: DictDb;
  private _jobDb: DictDb;
  private _cardDb: DictDb;
  private _shoesDb: DictDb;
  private _armorDb: DictDb;
  private _skillDb: DictDb;
  private _shieldDb: DictDb;
  private _garmentDb: DictDb;
  private _elementDb: DictDb;
  private _accessoryDb: DictDb;
  private _weaponTypeDb: DictDb;

  private _shoesCardDb: DictDb;
  private _armorCardDb: DictDb;
  private _shieldCardDb: DictDb;
  private _weaponCardDb: DictDb;
  private _garmentCardDb: DictDb;
  private _headgearCardDb: DictDb;
  private _accessoryCardDb: DictDb;

  private _foodDb: NestedDictDb;
  private _ammoDb: NestedDictDb;
  private _weaponDb: NestedDictDb;
  private _headgearDb: NestedDictDb;

  /* V2 databases */
  private _jobDb2: JobDB_V2;
  private _weaponDb2: WeaponDB_V2;
  private _shieldDb2: ArmorDB_V2;
  private _headgearDb2: HeadgearDB_V2;
  private _armorDb2: ArmorDB_V2;
  private _garmentDb2: ArmorDB_V2;
  private _shoesDb2: ArmorDB_V2;
  private _accessoryDb2: ArmorDB_V2;
  private _cardDb2: CardDB_V2;
  private _foodDb2: FoodDB_V2;
  private _skillDb2: SkillDB_V2;

  private _battleCalcTargets: BehaviorSubject<Array<string>>;
  readonly battleCalcTargets: Observable<Array<string>>;

  private _loaded: BehaviorSubject<boolean>;
  public loaded$: Observable<boolean>;

  constructor(
    private jsonDbService: JsonDbService
  ) {
    this._jobDb = {};
    this._mobDb = {};
    this._foodDb = {};
    this._ammoDb = {};
    this._cardDb = {};
    this._shoesDb = {};
    this._armorDb = {};
    this._skillDb = {};
    this._shieldDb = {};
    this._weaponDb = {};
    this._elementDb = {};
    this._garmentDb = {};
    this._headgearDb = {};
    this._accessoryDb = {};
    this._weaponTypeDb = {};

    this._shoesCardDb = {};
    this._armorCardDb = {};
    this._shieldCardDb = {};
    this._weaponCardDb = {};
    this._garmentCardDb = {};
    this._headgearCardDb = {};
    this._accessoryCardDb = {};

    /* V2 DBs */
    this._jobDb2 = {};
    this._weaponDb2 = {
      "Gatling Gun": {},
      "Grenade Launcher": {},
      "One-handed Axe": {},
      "Two-handed Axe": {},
      "Two-handed Spear": {},
      "Two-handed Sword": {},
      "Book": {},
      Bow: {},
      Dagger: {},
      Instrument: {},
      Katar: {},
      Knuckles: {},
      Mace: {},
      Revolver: {},
      Rifle: {},
      Shotgun: {},
      Shuriken: {},
      Spear: {},
      Staff: {},
      Sword: {},
      Unarmed: {},
      Whip: {}
    };
    this._shieldDb2 = {};
    this._headgearDb2 = {
      Lower: {},
      Middle: {},
      Upper: {}
    }
    this._armorDb2 = {};
    this._garmentDb2 = {};
    this._shoesDb2 = {};
    this._accessoryDb2 = {};
    this._cardDb2 = {};
    this._foodDb2 = {
      "Apsd Potion": {},
      "New World": {},
      "Summer Cocktails": {},
      BG: {},
      Eclage: {},
      Eden: {},
      Misc: {},
      Resistance: {},
      Stats: {
        AGI: {},
        DEX: {},
        INT: {},
        LUK: {},
        STR: {},
        VIT: {}
      }
    };
    this._skillDb2 = {};

    this._battleCalcTargets = new BehaviorSubject<Array<string>>([]);
    this.battleCalcTargets = this._battleCalcTargets.asObservable();

    this._loaded = new BehaviorSubject<boolean>(false);
    this.loaded$ = this._loaded.asObservable();
  }

  initializeCore() {
    /* this part is completely async */
    let res = new Observable<boolean>((observer) => {
      forkJoin([
        this.jsonDbService.loadDatabase('assets/db/job.db.json'),
        this.jsonDbService.loadDatabase('assets/db/shoes.db.json'),
        this.jsonDbService.loadDatabase('assets/db/armor.db.json'),
        this.jsonDbService.loadDatabase('assets/db/shield.db.json'),
        this.jsonDbService.loadDatabase('assets/db/weapon.db.json'),
        this.jsonDbService.loadDatabase('assets/db/garment.db.json'),
        this.jsonDbService.loadDatabase('assets/db/headgear.db.json'),
        this.jsonDbService.loadDatabase('assets/db/accessory.db.json'),
        this.jsonDbService.loadDatabase('assets/db/weapon-type.db.json'),
        this.jsonDbService.loadDatabase('assets/db/element.db.json'),
        this.jsonDbService.loadDatabase('assets/db/food.db.json'),
        this.jsonDbService.loadDatabase('assets/db/mob.db.json'),
        this.jsonDbService.loadDatabase('assets/db/skill.db.json'),
        this.jsonDbService.loadDatabase('assets/db/ammo.db.json'),
        this.jsonDbService.loadDatabase('assets/db/card.db.json'),
        of({ name: 'Fake', value: 'Data' }).pipe(delay(100)),
      ]).subscribe((dbResp) => {
        this._jobDb = dbResp[0] as DictDb;
        this._shoesDb = dbResp[1] as DictDb;
        this._armorDb = dbResp[2] as DictDb;
        this._shieldDb = dbResp[3] as DictDb;
        this._weaponDb = dbResp[4] as NestedDictDb;
        this._garmentDb = dbResp[5] as DictDb;
        this._headgearDb = dbResp[6] as NestedDictDb;
        this._accessoryDb = dbResp[7] as DictDb;
        this._weaponTypeDb = dbResp[8] as DictDb;
        this._elementDb = dbResp[9] as DictDb;
        this._foodDb = dbResp[10] as NestedDictDb;
        this._mobDb = dbResp[11] as DictDb;
        this._skillDb = dbResp[12] as DictDb;
        this._ammoDb = dbResp[13] as DictDb;
        this._cardDb = dbResp[14] as DictDb;

        /* V2 databases */
        this._jobDb2 = dbResp[0] as JobDB_V2;
        this._weaponDb2 = dbResp[4] as WeaponDB_V2;
        this._shieldDb2 = dbResp[3] as ArmorDB_V2;
        this._headgearDb2 = dbResp[6] as HeadgearDB_V2;
        this._armorDb2 = dbResp[2] as ArmorDB_V2;
        this._garmentDb2 = dbResp[5] as ArmorDB_V2;
        this._shoesDb2 = dbResp[1] as ArmorDB_V2;
        this._accessoryDb2 = dbResp[7] as ArmorDB_V2;
        this._cardDb2 = dbResp[14] as CardDB_V2;
        this._foodDb2 = dbResp[10] as FoodDB_V2;
        this._skillDb2 = dbResp[12] as SkillDB_V2;

        /* emit fake data for the battle calc */
        //this._battleCalcTargets.next(['GM Kutsuru', 'GM Johnny']);

        // split cardDb into each location
        // FIXME: split at db level instead ?
        this.updateCardDbs();

        /* return somehting for the "base" call */
        observer.next(true);

        /* update the laoded stat */
        this._loaded.next(true);
      });
    });
    return res;
  }

  private updateCardDbs() {
    for (let card in this._cardDb) {
      let currentCard = this._cardDb[card];
      if ('shoes' === currentCard['location'])
        this._shoesCardDb[card] = currentCard;
      if ('armor' === currentCard['location'])
        this._armorCardDb[card] = currentCard;
      if ('accessory' === currentCard['location'])
        this._accessoryCardDb[card] = currentCard;
      if ('weapon' === currentCard['location'])
        this._weaponCardDb[card] = currentCard;
      if ('shield' === currentCard['location'])
        this._shieldCardDb[card] = currentCard;
      if ('headgear' === currentCard['location'])
        this._headgearCardDb[card] = currentCard;
      if ('garment' === currentCard['location'])
        this._garmentCardDb[card] = currentCard;
    }
  }

  public get jobDb() {
    return this._jobDb;
  }
  public get shoesDb() {
    return this._shoesDb;
  }
  public get armorDb() {
    return this._armorDb;
  }
  public get shieldDb() {
    return this._shieldDb;
  }
  public get weaponDb() {
    return this._weaponDb;
  }
  public get garmentDb() {
    return this._garmentDb;
  }
  public get headgearDb() {
    return this._headgearDb;
  }
  public get accessoryDb() {
    return this._accessoryDb;
  }
  public get weaponTypeDb() {
    return this._weaponTypeDb;
  }
  public get elementDb() {
    return this._elementDb;
  }
  public get foodDb() {
    return this._foodDb;
  }
  public get mobDb() {
    return this._mobDb;
  }
  public get skillDb() {
    return this._skillDb;
  }
  public get ammoDb() {
    return this._ammoDb;
  }
  public get cardDb() {
    return this._cardDb;
  }
  public get shoesCardDb() {
    return this._shoesCardDb;
  }
  public get armorCardDb() {
    return this._armorCardDb;
  }
  public get shieldCardDb() {
    return this._shieldCardDb;
  }
  public get weaponCardDb() {
    return this._weaponCardDb;
  }
  public get garmentCardDb() {
    return this._garmentCardDb;
  }
  public get headgearCardDb() {
    return this._headgearCardDb;
  }
  public get accessoryCardDb() {
    return this._accessoryCardDb;
  }
  /* DB V2 */
  public get jobDbV2() {
    return this._jobDb2
  }
  public get weaponDbV2(){
    return this._weaponDb2;
  }
  public get shieldDbV2(){
    return this._shieldDb2;
  }
  public get headgearDbV2() {
    return this._headgearDb2;
  }
  public get armorDbV2(){
    return this._armorDb2;
  }
  public get garmentDbV2() {
    return this._garmentDb2;
  }
  public get shoesDbV2() {
    return this._shoesDb2;
  }
  public get accessoryDbV2() {
    return this._accessoryDb2;
  }
  public get cardDbV2() {
    return this._cardDb2;
  }
  public get foodDbV2() {
    return this._foodDb2;
  }
  public get skillDbV2(){
    return this._skillDb2;
  }
}
