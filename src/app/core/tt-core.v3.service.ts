import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { forkJoin, Observable } from "rxjs";
import { AmmoType, DBAmmo, DBFood, DBItem, DBItemCombo, DBJob, DBMob, DBSkill, DBWeaponType, ElementDBV3, FoodCategory, FoodStatsNames, JSONFood, DBMobClass, DBWeaponTypeKey, DBWeaponTypeEntry, DBEnchantTypes, DBEnchant, EnchantDBV3, DBPet, DBSkillEnum, CardTypes } from "./tt-models.v3";
import { DefaultMap, SuperMap } from "./utils";

const compareByName = <V extends { name: string }>(a: V, b: V): number => {
    return a.name.localeCompare(b.name);
}

@Injectable({ providedIn: 'root' })
export class TTCoreServiceV3 {
    /* injects */
    readonly #http = inject(HttpClient);

    /* varbs */
    #loaded: WritableSignal<boolean> = signal(false);

    /* item databases */
    itemDB: Map<number, DBItem> = new Map();
    headgearDB: Map<number, DBItem> = new Map();
    armorDB: Map<number, DBItem> = new Map();
    weaponDB: Map<number, DBItem> = new Map();
    shieldDB: Map<number, DBItem> = new Map();
    garmentDB: Map<number, DBItem> = new Map();
    shoesDB: Map<number, DBItem> = new Map();
    accessoryDB: Map<number, DBItem> = new Map();
    itemComboDB: DBItemCombo[] = [];
    // cardDB: SuperMap<number, DBItem> = new SuperMap(compareByName);
    cardDB: Record<CardTypes | 'None', SuperMap<number, DBItem>> = {    // 'None' is used for enchants like DEF+4
        Headgear: new SuperMap(compareByName),
        Armor: new SuperMap(compareByName),
        Weapon: new SuperMap(compareByName),
        Shield: new SuperMap(compareByName),
        Garment: new SuperMap(compareByName),
        Shoes: new SuperMap(compareByName),
        Accessory: new SuperMap(compareByName),
        None: new SuperMap(compareByName)
    }

    /* other databases */
    jobDB: Map<string, DBJob> = new Map();
    mobDB: Map<number, DBMob> = new Map();
    skillDB: Map<number, DBSkill> = new Map();
    #skillEnumToId: DefaultMap<DBSkillEnum, number[]> = new DefaultMap([]);    // key=enum, value=skill ids
    elementDB: ElementDBV3 = {} as any;    // FIXME: provide function for "target" "source" ele ...
    weaponTypeDB: Map<DBWeaponTypeKey, DBWeaponTypeEntry> = new Map();
    ammoDB: Map<string, DBAmmo> = new Map();
    foodDB: Map<number, DBFood> = new Map();
    enchantDB: Map<DBEnchantTypes, DBEnchant[]> = new Map();
    petDB: SuperMap<number, DBPet> = new SuperMap(compareByName);


    /*** public functions ***/
    initializeCore$() {
        return new Observable<boolean>((obs) => {
            if (this.#loaded()) {
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
                    this._loadDB('assets/db/enchant.db.V3.json'),       // 9
                    this._loadDB('assets/db/pet.db.V3.json'),           // 10
                    this._loadDB('assets/db/item-custom.db.V3.json'),   // 11
                ])
                    .subscribe((dbRes) => {
                        /* Item DB */
                        const itemDbFull = [...dbRes[0] as DBItem[], ...dbRes[11] as DBItem[]]; // merge normal & custom
                        for (const item of itemDbFull) {
                            if (item.disabled) continue; // skip items which are disabled
                            /* remove "None" item scripts */
                            if (item.itemScript === 'None') item.itemScript = "";
                            this.itemDB.set(item.ID, item);
                            switch (item.type) {
                                case 'Weapon One-Hand':
                                case 'Weapon Two-Hand':
                                    this.weaponDB.set(item.ID, item);
                                    break;
                                case 'Armor':
                                    switch (item.subType) {
                                        case 'Headgear':
                                            this.headgearDB.set(item.ID, item);
                                            break;
                                        case 'Armor':
                                            this.armorDB.set(item.ID, item);
                                            break;
                                        case 'Shield':
                                            this.shieldDB.set(item.ID, item);
                                            break;
                                        case 'Garment':
                                            this.garmentDB.set(item.ID, item);
                                            break;
                                        case 'Shoes':
                                            this.shoesDB.set(item.ID, item);
                                            break;
                                        case 'Accessory':
                                            this.accessoryDB.set(item.ID, item);
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
                                    this.cardDB[item.subType as CardTypes].set(item.ID, item);
                                    break;
                            }
                        }

                        /* Job DB */
                        for (const jobName in dbRes[1] as Record<string, DBJob>) {
                            this.jobDB.set(jobName, dbRes[1][jobName]);
                        }

                        /* item Combo */
                        this.itemComboDB = dbRes[2] as DBItemCombo[];

                        /* Mob DB */
                        const mobDbFromFile = dbRes[3] as Record<string, Omit<DBMob, 'name'>>;
                        for (const mobName in mobDbFromFile) {
                            this.mobDB.set(mobDbFromFile[mobName].mid, {
                                ...mobDbFromFile[mobName],
                                name: mobName
                            });
                        }

                        /* Skill DB */
                        const skillDbFromFile = dbRes[4] as Record<string, Omit<DBSkill, 'name'>>;
                        for (const skillName in skillDbFromFile) {
                            const skill = skillDbFromFile[skillName];
                            this.skillDB.set(skill.id, {
                                ...skill,
                                name: skillName
                            });

                            /* add to mapping DB */
                            if (!this.#skillEnumToId.has(skill.enum)) {
                                this.#skillEnumToId.set(skill.enum, []);
                            }
                            this.#skillEnumToId.get(skill.enum)!.push(skill.id);
                        }

                        /* Element DB */
                        this.elementDB = dbRes[5] as ElementDBV3;

                        /* Weapon Type DB */
                        const wTFromFile = dbRes[6] as Record<DBWeaponTypeKey, DBWeaponTypeEntry>;
                        for (const wT in wTFromFile) {
                            this.weaponTypeDB.set(wT as DBWeaponTypeKey, wTFromFile[wT]);
                        }

                        /* Ammo DB */
                        const ammoDBFromFile: { [key in AmmoType]: { [key: string]: Omit<DBAmmo, 'type'> } } = dbRes[7] as any;
                        for (const curType in ammoDBFromFile) {
                            for (const curAmmoName in ammoDBFromFile[curType]) {
                                const curAmmo = ammoDBFromFile[curType as AmmoType][curAmmoName];
                                this.ammoDB.set(curAmmoName, {
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
                                        this.foodDB.set(food.gid, {
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
                                    this.foodDB.set(food.gid, {
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
                        /* enchant DB */
                        const enchants = dbRes[9] as EnchantDBV3;

                        for (const enchantGr in enchants) {
                            if (!this.enchantDB.has(enchantGr as DBEnchantTypes)) {
                                this.enchantDB.set(enchantGr as DBEnchantTypes, []);
                            }
                            for (const enchantName in enchants[enchantGr]) {
                                const entry: DBEnchant = {
                                    itemId: enchants[enchantGr][enchantName],
                                    name: enchantName
                                };
                                this.enchantDB.get(enchantGr as DBEnchantTypes)!.push(entry);
                            }
                        }
                        /* pet DB */
                        const pets = dbRes[10] as DBPet[];
                        pets.forEach(pet => this.petDB.set(pet.ID, pet));

                        /* done */
                        this.#loaded.set(true);
                        obs.next(true);
                        obs.complete();
                    });
                // TODO: Catch failures?
            }
        })
    }
    public canWearItem(jobMask: number, item: DBItem): boolean {
        return (Number(item.jobMask) & jobMask) == jobMask;
    }
    public getMobClass(mob: DBMob): DBMobClass {
        if (mob.mode.isBoss || mob.mode.isMvP) return 'boss';
        // FIXME: guardian?
        return 'normal';
    }
    public getSkillIDs(skillEnum: DBSkillEnum): number[] {
        return this.#skillEnumToId.get(skillEnum);
    }

    /*** private functions ***/
    private _loadDB(path: string) {
        return this.#http.get(path);
    }

    /*** getter ***/
    get $loaded() {
        return this.#loaded.asReadonly();
    }

    // derived
    get allJobNames() {
        return Array.from(this.jobDB.keys());
    }
}