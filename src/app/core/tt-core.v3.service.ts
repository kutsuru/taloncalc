import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { forkJoin, Observable } from "rxjs";
import { DBItem, DBItemCombo, DBJob } from "./models.v3";

const DB_PATH = 'assets/db/item.db.V3.json';

@Injectable({ providedIn: 'root' })
export class TTCoreServiceV3 {
    /* injects */
    private readonly _http = inject(HttpClient);

    /* varbs */
    private _loaded: WritableSignal<boolean> = signal(false);

    /* item databases */
    private _itemDB: Map<number, DBItem> = new Map();
    private _headgearDB: Map<number, DBItem> = new Map();
    private _armorDB: Map<number, DBItem> = new Map();
    private _waeponDB: Map<number, DBItem> = new Map();
    private _shieldDB: Map<number, DBItem> = new Map();
    private _garmentDB: Map<number, DBItem> = new Map();
    private _shoesDB: Map<number, DBItem> = new Map();
    private _accessoryDB: Map<number, DBItem> = new Map();
    private _cardDB: Map<number, DBItem> = new Map();
    private _itemCombo: DBItemCombo[] = [];

    /* other databases */
    private _jobDB: Map<string, DBJob> = new Map();

    /*** public functions ***/
    initializeCore$() {
        return new Observable<boolean>((obs) => {
            if (this._loaded()) {
                obs.next(true);
                obs.complete();
            } else {
                /* load assets */
                forkJoin([
                    this._loadDB('assets/db/item.db.V3.json'),          // 0
                    this._loadDB('assets/db/job.db.V3.json'),           // 1
                    this._loadDB('assets/db/item-combo.db.V3.json'),    // 2
                ])
                    .subscribe((dbRes) => {
                        /* Item DB */
                        for (const item of dbRes[0] as DBItem[]) {
                            this._itemDB.set(item.ID, item);
                            switch (item.type) {
                                case 'Weapon One-Hand':
                                case 'Weapon Two-Hand':
                                    this._waeponDB.set(item.ID, item);
                                    break;
                                case 'Armor':
                                    switch (item.subType) {
                                        case 'Headgear':
                                            this._headgearDB.set(item.ID, item);
                                            break;
                                        case 'Armor':
                                            this._armorDB.set(item.ID, item);
                                            break;
                                        case 'Shield':
                                            this._shieldDB.set(item.ID, item);
                                            break;
                                        case 'Garment':
                                            this._garmentDB.set(item.ID, item);
                                            break;
                                        case 'Shoes':
                                            this._shoesDB.set(item.ID, item);
                                            break;
                                        case 'Accessory':
                                            this._accessoryDB.set(item.ID, item);
                                            break;
                                        case 'Costume':
                                            // ignore?
                                            break;
                                        default:
                                            console.log(item);
                                            break;
                                    }
                                    break;
                                case 'Card':
                                    this._cardDB.set(item.ID, item);
                                    break;
                            }
                        }

                        /* Job DB */
                        for (const jobName in dbRes[1] as Record<string, DBJob>) {
                            this._jobDB.set(jobName, dbRes[1][jobName]);
                        }

                        /* item Combo */
                        this._itemCombo = dbRes[2] as DBItemCombo[];

                        /* done */
                        this._loaded.set(true);
                        obs.next(true);
                        obs.complete();
                    });
                // TODO: Catch failures?
            }
        })
    }
    public canWearItem(jobMask: number, item: DBItem): boolean {
        return (Number(item.jobMask) & jobMask) == jobMask
    }

    /*** private functions ***/
    private _loadDB(path: string) {
        return this._http.get(path);
    }

    /*** getter ***/
    get $loaded() {
        return this._loaded.asReadonly();
    }

    // derived
    get allJobNames() {
        return Array.from(this._jobDB.keys());
    }

    // pure
    get jobDB() {
        return this._jobDB;
    }
    get itemDB() {
        return this._itemDB;
    }
    get headgearDB() {
        return this._headgearDB;
    }
    get armorDB() {
        return this._armorDB;
    }
    get weaponDB() {
        return this._waeponDB;
    }
    get shieldDB() {
        return this._shieldDB;
    }
    get garmentDB() {
        return this._garmentDB;
    }
    get shoesDB() {
        return this._shoesDB;
    }
    get accessoryDB() {
        return this._accessoryDB;
    }
    get cardDB() {
        return this._cardDB;
    }
    get itemComboDB() {
        return this._itemCombo;
    }
}