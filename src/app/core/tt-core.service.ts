import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, forkJoin, Observable, of } from 'rxjs';
import { ItemDbService } from './item-db.service';
import { JobDbService } from './job-db.service';
import { DictDb, ItemDB, JobDB, NestedDictDb } from './models';

@Injectable({
  providedIn: 'root',
})
export class TTCoreService {
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

  private _battleCalcTargets: BehaviorSubject<Array<string>>;
  readonly battleCalcTargets: Observable<Array<string>>;

  constructor(
    private jobDbService: JobDbService,
    private itemDbService: ItemDbService
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

    this._battleCalcTargets = new BehaviorSubject<Array<string>>([]);
    this.battleCalcTargets = this._battleCalcTargets.asObservable();
  }

  initializeCore() {
    /* this part is completely async */
    let res = new Observable<boolean>((observer) => {
      forkJoin([
        this.jobDbService.loadDatabase(),
        this.itemDbService.loadDatabase('assets/db/shoes.db.json'),
        this.itemDbService.loadDatabase('assets/db/armor.db.json'),
        this.itemDbService.loadDatabase('assets/db/shield.db.json'),
        this.itemDbService.loadDatabase('assets/db/weapon.db.json'),
        this.itemDbService.loadDatabase('assets/db/garment.db.json'),
        this.itemDbService.loadDatabase('assets/db/headgear.db.json'),
        this.itemDbService.loadDatabase('assets/db/accessory.db.json'),
        this.itemDbService.loadDatabase('assets/db/weapon-type.db.json'),
        this.itemDbService.loadDatabase('assets/db/element.db.json'),
        this.itemDbService.loadDatabase('assets/db/food.db.json'),
        this.itemDbService.loadDatabase('assets/db/mob.db.json'),
        this.itemDbService.loadDatabase('assets/db/skill.db.json'),
        this.itemDbService.loadDatabase('assets/db/ammo.db.json'),
        this.itemDbService.loadDatabase('assets/db/card.db.json'),
        of({ name: 'Fake', value: 'Data' }).pipe(delay(2500)),
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

        /* emit fake data for the battle calc */
        //this._battleCalcTargets.next(['GM Kutsuru', 'GM Johnny']);

        // split cardDb into each location
        // FIXME: split at db level instead ?
        this.updateCardDbs();

        /* return somehting for the "base" call */
        observer.next(true);
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
}
