/*** imports ***/
import { Injectable } from "@angular/core";

/*** definitions ***/
const BONUS_NAME_TO_STR: Record<string, string> = {
    'bIgnoreDefClass': 'Ignore DEF for Class'
};

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTBonusTranslatorService {
    /*** public functions ***/
    /**
     * Translates a itemscript into human readable language
     * @param bonus 
     */
    toReadable(bonus: string): string[] {
        const res: string[] = [];
        /* loop over scripts */
        for (const curBonus of bonus.split(';')) {
            const parts = curBonus.split(',').map(_ => _.trim());
            if (parts.length >= 1 && parts[0].length > 0) {
                /**
                 * 0        mainCmd subCmd
                 * 1...n    args
                 */
                const [mainCmd, subCmd] = parts[0].split(' ');
                parts.shift();  // remove from list

                /* find subfunction */
                let subRes = '';
                switch (mainCmd) {
                    case 'bonus':
                        subRes = this.#translateBonus(subCmd, parts);
                        break;
                }
                if (subRes.length > 0) res.push(subRes);
            }
        }
        return res;
    }

    /*** mainCmd handler ***/
    #translateBonus(subCmd: string, args: string[]): string {
        let res: string = '';
        if (subCmd in BONUS_NAME_TO_STR) {
            res = BONUS_NAME_TO_STR[subCmd];

            switch(subCmd){
                case 'bIgnoreDefClass':
                    res += ` ${args[0]}`
                    break;
            }
        }

        return res;
    }
}