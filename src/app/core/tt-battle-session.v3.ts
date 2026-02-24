import { computed, inject, Injectable, signal } from "@angular/core";
import { TTCoreServiceV3 } from "./tt-core.v3.service";
import { TTSessionInfoV3Service } from "./tt-session-info.v3.service";
import { DBMob, DBSkill } from "./models.v3";

@Injectable()
export class TTBattleSessionV3 {
    /* injects */
    private readonly _core = inject(TTCoreServiceV3);
    private readonly _session = inject(TTSessionInfoV3Service);

    /* results */
    minDamage = signal(0);
    maxDamage = signal(0);

    /* varbs */
    private _skill: DBSkill | undefined;
    private _skillLvl = 0;
    private _target: DBMob | undefined;
    private _isPvp = false;

    // TODO: add auto. calc to battle-session?

    /*** public functions ***/
    public init() {
        /* init data without calculation */
    }
    public simulate() {
        console.log('Battle is simualted...');
        let damage: number[] = [];
        if (this._skill && this._target) {
            damage = this._calcAttackDmg(false, false);
        }
        // FIXME, manage dual wielding
        this.minDamage.set(damage[0]);
        this.maxDamage.set(damage[1]);
    }
    public updateSkill(skillId: number, skillLvl: number) {
        this._skill = this._core.skillDB.get(skillId);
        this._skillLvl = skillLvl;
    }
    public updateTarget(target: DBMob | undefined) {
        this._target = target;
    }

    /*** private functions ***/
    private _calcAttackDmg(isCritAttack: boolean, isDualWielding: boolean): number[] {
        let damage = [0, 0];  // 0: Min, 1: Max

        /* mange misc skill with fixed damage */
        if (this._skill!.id == 22)
            // Throw Stone#22
            return damage.map(() => 50);
        else if (this._skill!.id == 283)
            // Pressure#283
            return damage.map(() => 500 + 300 * this._skillLvl);
        else if (this._skill!.id == 397) {
            // Throw Zeny#397
            let zeny_min_damage = 500 * this._skillLvl;
            let zeny_max_damage = zeny_min_damage * 2;
            damage = [zeny_min_damage, zeny_max_damage];

            // Damage divided by 3 on boss type monsters
            // Damage divided by 2 on players, FIXME: better handling for Taijin
            return damage.map((x) => {
                return Math.floor(
                    x / (this._target!.mode.isBoss ? 3 : this._isPvp ? 2 : 1)
                );
            });
        }


        //skill_info = retrieve_skill_info(this._activeSkill['id'], this._activeSkill['lv']);
        console.log('before: calcPhysicalAttackDamage');
        console.log(damage);

        if (this._skill!.isMagicAttack)
            damage = this._calcMagicalAttackDamage(damage);
        else
            damage = this._calcPhysicalAttackDamage(isCritAttack, isDualWielding);

        console.log('after: calcPhysicalAttackDamage');
        console.log(damage);
        damage = damage.map((x) => {
            return this._skill!.isConsideredAsSingleHit
                ? x - (x % this._skill!.hits)
                : x * this._skill!.hits;
        });

        // FIXME: Lex Aeterna
        // if (this._si['activeStatus']['Lex Aeterna']) {
        //     if (this._activeSkill['isMultiHits'])
        //         // Manage multi-hit
        //         damage = this.applyDamageModifier(
        //             damage,
        //             100 + 100 / this._activeSkill['hits']
        //         );
        //     else damage = this.applyDamageModifier(damage, 200);
        // }

        // FIXME: Manage damage reduction status
        // SC_ARMORCHANGE, SC_ENERGYCOAT, SC_FOGWALL, SC_DEFENDER, SC_ASSUMPTIO

        // FIXME: Manage RC2 damage modifier

        // Asura Strike#197#321 soft cap damage management
        if (197 == this._skill!.id || 321 == this._skill!.id)
            damage = damage.map((x) => this._applyAsuraSoftCap(x));

        return damage.map((x) => Math.max(0, x));
    }

    private _calcMagicalAttackDamage(damage: number[]): number[] {
        return [0, 0];
    }
    private _calcPhysicalAttackDamage(isCriticalAttack: boolean, isDualWielding: boolean): number[] {
        return [0, 0];
    }
    private _applyAsuraSoftCap(asuraDamage: number): number {
        let softCap = 200000;

        if (asuraDamage > softCap) {
            let overflowDamage = asuraDamage - softCap;
            let smoothedDamage =
                1.323031 +
                0.5996693 * overflowDamage -
                0.000001183789 * overflowDamage ** 2 +
                2.125968e-12 * overflowDamage ** 3 -
                2.736422e-18 * overflowDamage ** 4 +
                1.647955e-24 * overflowDamage ** 5;
            asuraDamage = Math.floor(200000 + smoothedDamage);
        }

        return asuraDamage;
    }
}