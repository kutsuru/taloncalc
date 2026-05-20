import { TemplatePortal } from "@angular/cdk/portal";

import { EventEmitter, Inject, Injectable, DOCUMENT, signal } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "src/environments/environment";

export interface PopupSetting {
    buffs: boolean,
    statsInfo: boolean
}

@Injectable({
    providedIn: 'root'
})
export class TtSettingsService {
    /* Popup Settings */
    popup: PopupSetting;
    popupChanged$: EventEmitter<PopupSetting>;

    /* overlay / container */
    private _showSettings: BehaviorSubject<boolean>;
    public showSettings$: Observable<boolean>;

    /* signals */
    debug = signal(!environment.production);

    constructor() {
        this._showSettings = new BehaviorSubject(false);
        this.showSettings$ = this._showSettings.asObservable();
        /* set DEFAULT values */
        this.popup = {
            buffs: false,
            statsInfo: false
        }
        /* create all async object */
        this.popupChanged$ = new EventEmitter();
    }

    /* public functions */
    showSettings() {
        this._showSettings.next(true);
    }
    hideSettings() {
        this._showSettings.next(false);
    }

    /* change settings functions */
    setPopup(popup: keyof PopupSetting, value: boolean) {
        this.popup[popup] = value;
        this.popupChanged$.emit(this.popup);
    }
}