/*** imports ***/
import { TTBonusEngineService, LocalOptions } from './tt-bonus-engine.service';

/*** types ***/
// FIXME: make parameter variable length
export type SCFunction = (be: TTBonusEngineService, opts: LocalOptions, duration: number, value: number) => void;

/*** functions & export ***/
/**
 * Documentation
 * https://github.com/rathena/rathena/blob/master/doc/status_change.txt
 */
export const SC_FUNCTIONS: Record<string, SCFunction> = {
    SC_ASPDPOTION0: (be, opts, dur, val) => {
        be.session.stats.aspdRate += 10;
    },
    SC_ASPDPOTION1: (be, opts, dur, val) => {
        be.session.stats.aspdRate += 15;
    },
    SC_ASPDPOTION2: (be, opts, dur, val) => {
        be.session.stats.aspdRate += 20;
    },
    SC_ASPDPOTION3: (be, opts, dur, val) => {
        be.session.stats.aspdRate += 25;
    },
    SC_INCCRI: (be, opts, dur, val) => {
        /* will only use max value */
        be.session.stats.scIncCrit = Math.max(be.session.stats.scIncCrit, val);
    },
    SC_INCALLSTATUS: (be, opts, dur, val) => {
        /* increase all stats */
        be.incAllStatsBy(val);
    },
    SC_ANGELUS: (be, opts, dur, val) => {
        /* call Angelus with Level <value> */
        be.useSkill(30, val);
    },
    SC_MANU_ATK: (be, opts, dur, val) => {
        // FIXME: add some fields for regions
        console.log('Add / reduce deamge from Region mobs by', val, '%');
    },
    SC_MANU_DEF: (be, opts, dur, val) => {
        // FIXME: add some fields for regions
        console.log('Add / reduce deamge from Region mobs by', val, '%');
    },
    SC_MANU_MATK: (be, opts, dur, val) => {
        // FIXME: add some fields for regions
        console.log('Add / reduce deamge from Region mobs by', val, '%');
    },
    SC_SPL_ATK: (be, opts, dur, val) => {
        // FIXME: add some fields for regions
        console.log('Add / reduce deamge from Region mobs by', val, '%');
    },
    SC_SPL_DEF: (be, opts, dur, val) => {
        // FIXME: add some fields for regions
        console.log('Add / reduce deamge from Region mobs by', val, '%');
    },
    SC_SPL_MATK: (be, opts, dur, val) => {
        // FIXME: add some fields for regions
        console.log('Add / reduce deamge from Region mobs by', val, '%');
    },
    SC_BLESSING: (be, opts, dur, val) => {
        /* call blessing */
        be.useSkill(31, val);
    },
    SC_ASSUMPTIO: (be, opts, dur, val) => {
        /* cast assump */
        be.useSkill(267, val);
    },
    SC_WINDWALK: (be, opts, dur, val) => {
        /* cast windwalk */
        be.useSkill(273, val);
    },
    SC_BENEDICTIO: (be, opts, dur, val) => {
        /* cast Benedictio Sanctissimi Sacramenti*/
        be.useSkill(93, val);
    },
    SC_INCREASEAGI: (be, opts, dur, val) => {
        /* cast increase agi */
        be.useSkill(27, val);
    },
    SC_OGH_ATK: (be, opts, dur, val) => {
        // FIXME: add regions with demage increase
        console.log('Increase % more deamge on OGH mobs');
    },
    SC_WATERWEAPON: (be) => {
        be.session.stats.atkEle = 'water';
    },
    SC_IMPOSITIO: (be, opts, dur, val) => {
        be.useSkill(90, val);
    },
    SC_GLORIA: (be, opts, dur, val) => {
        be.useSkill(100, val);
    },
    SC_VENOMBLEED: (be) => {
        be.session.stats.maxHPRate -= 15;   // FIXME: not sure if correct
    },
    SC_STOMACHACHE: (be, opts, dur, val) => {
        be.incAllStatsBy(-val);
    },
    SC_MAGNIFICAT: (be, opts, dur, val) => {
        be.useSkill(99, val);
    },
    SC_SPCOST_RATE: (be,opts,dur,val) => {
        be.session.stats.useSPrate -= val;
    }
};