import { EventEmitter, Injectable } from "@angular/core";

export interface PopupSetting{
    buffs: boolean,
    statsInfo: boolean
}

@Injectable({
    providedIn: 'root'
})
export class TtSettingsService{
    /* Popup Settings */
    popup: PopupSetting;
    popupChanged$: EventEmitter<PopupSetting>;

    constructor(){
        /* set DEFAULT values */
        this.popup = {
            buffs: false,
            statsInfo: false
        }
        /* create all async object */
        this.popupChanged$ = new EventEmitter();
    }

    setPopup(popup: keyof PopupSetting, value: boolean){
        this.popup[popup] = value;
        this.popupChanged$.emit(this.popup);
    }
}