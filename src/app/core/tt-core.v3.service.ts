import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { forkJoin, Observable } from "rxjs";
import { AmmoType, DBAmmo, DBFood, DBItem, DBItemCombo, DBJob, DBMob, DBSkill, DBWeaponType, ElementDBV3, FoodCategory, FoodStatsNames, JSONFood, DBMobClass, DBWeaponTypeKey, DBWeaponTypeEntry } from "./tt-models.v3";
import { DefaultMap } from "./utils";

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
    private _mobDB: Map<number, DBMob> = new Map();
    private _skillDB: Map<number, DBSkill> = new Map();
    private _skillEnumToId: DefaultMap<string, number[]> = new DefaultMap([]);    // key=enum, value=skill ids
    private _elementDB: ElementDBV3 = {} as any;    // FIXME: provide function for "target" "source" ele ...
    private _weaponTypeDB: Map<DBWeaponTypeKey, DBWeaponTypeEntry> = new Map();
    private _ammoDB: Map<string, DBAmmo> = new Map();
    private _foodDB: Map<number, DBFood> = new Map();


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
                    this._loadDB('assets/db/mob.db.json'),              // 3
                    this._loadDB('assets/db/skill.db.V3.json'),         // 4
                    this._loadDB('assets/db/element.db.json'),          // 5
                    this._loadDB('assets/db/weapon-type.db.V3.json'),   // 6
                    this._loadDB('assets/db/ammo.db.json'),             // 7
                    this._loadDB('assets/db/food.db.V3.json'),          // 8
                ])
                    .subscribe((dbRes) => {
                        /* Item DB */
                        for (const item of dbRes[0] as DBItem[]) {
                            /* remove "None" item scripts */
                            if (item.itemScript === 'None') item.itemScript = "";
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

                        /* Mob DB */
                        const mobDbFromFile = dbRes[3] as Record<string, Omit<DBMob, 'name'>>;
                        for (const mobName in mobDbFromFile) {
                            this._mobDB.set(mobDbFromFile[mobName].mid, {
                                ...mobDbFromFile[mobName],
                                name: mobName
                            });
                        }

                        /* Skill DB */
                        const skillDbFromFile = dbRes[4] as Record<string, Omit<DBSkill, 'name'>>;
                        for (const skillName in skillDbFromFile) {
                            const skill = skillDbFromFile[skillName];
                            this._skillDB.set(skill.id, {
                                ...skill,
                                name: skillName
                            });

                            /* add to mapping DB */
                            if (!this._skillEnumToId.has(skill.enum)) {
                                this._skillEnumToId.set(skill.enum, []);
                            }
                            this._skillEnumToId.get(skill.enum)!.push(skill.id);
                        }

                        /* Element DB */
                        this._elementDB = dbRes[5] as ElementDBV3;

                        /* Weapon Type DB */
                        const wTFromFile = dbRes[6] as Record<DBWeaponTypeKey, DBWeaponTypeEntry>;
                        for (const wT in wTFromFile) {
                            this._weaponTypeDB.set(wT as DBWeaponTypeKey, wTFromFile[wT]);
                        }

                        /* Ammo DB */
                        const ammoDBFromFile: { [key in AmmoType]: { [key: string]: Omit<DBAmmo, 'type'> } } = dbRes[7] as any;
                        for (const curType in ammoDBFromFile) {
                            for (const curAmmoName in ammoDBFromFile[curType]) {
                                const curAmmo = ammoDBFromFile[curType as AmmoType][curAmmoName];
                                this._ammoDB.set(curAmmoName, {
                                    ...curAmmo,
                                    type: curType as AmmoType
                                });
                            }
                        }

                        /* Food DB */
                        const foodDBFromFile = dbRes[8] as {
                            Stats: { [key in FoodStatsNames]: { [key: string]: JSONFood } },
                        } & {
                            [key in Exclude<FoodCategory, 'Stats'>]: { [key: string]: JSONFood }
                        };

                        for (const foodCat in foodDBFromFile) {
                            if (foodCat === 'Stats') {
                                for (const foodStat in foodDBFromFile[foodCat]) {
                                    for (const foodName in foodDBFromFile[foodCat][foodStat as FoodStatsNames]) {
                                        const food = foodDBFromFile[foodCat][foodStat][foodName] as JSONFood;
                                        this._foodDB.set(food.gid, {
                                            ID: food.gid,
                                            name: foodName,
                                            itemName: food.name,
                                            category: foodCat as FoodCategory,
                                            subCategory: foodStat as FoodStatsNames,
                                            bonus: food.bonus,
                                            dispelOnDeath: food.dispelOnDeath,
                                            duration: food.duration,
                                            description: food.description,
                                        });
                                    }
                                }
                            }
                            else {
                                /* all other foods */
                                for (const foodName in foodDBFromFile[foodCat]) {
                                    const food = foodDBFromFile[foodCat][foodName] as JSONFood;
                                    this._foodDB.set(food.gid, {
                                        ID: food.gid,
                                        name: foodName,
                                        category: foodCat as FoodCategory,
                                        bonus: food.bonus,
                                        dispelOnDeath: food.dispelOnDeath,
                                        duration: food.duration,
                                        description: food.description,
                                    });
                                }
                            }
                        }

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
    public getMobClass(mob: DBMob): DBMobClass {
        if (mob.mode.isBoss || mob.mode.isMvP) return 'boss';
        // FIXME: guardian?
        return 'normal';
    }
    public getSkillIDs(skillEnum: string): number[] {
        return this._skillEnumToId.get(skillEnum);
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
    get mobDB() {
        return this._mobDB;
    }
    get skillDB() {
        return this._skillDB;
    }
    get elementDB() {
        return this._elementDB;
    }
    get weaponTypeDB() {
        return this._weaponTypeDB;
    }
    get ammoDB() {
        return this._ammoDB;
    }
    get foodDB() {
        return this._foodDB;
    }
}