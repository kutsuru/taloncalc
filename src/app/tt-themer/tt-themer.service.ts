import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, OnInit } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

interface TTTheme {
    name: string,
    tag: string
}

@Injectable({
    providedIn: 'root'
})
export class TTThemerService implements OnInit {
    /* current theme */
    private _activeThemeData: TTTheme;
    private _activeTheme: BehaviorSubject<TTTheme>;
    readonly activeTheme$: Observable<TTTheme>;
    /* define available themes */
    public readonly themes: TTTheme[] = [
        {
            name: 'Default',
            tag: ''
        },
        {
            name: 'Dark',
            tag: 'dark-theme'
        },
        {
            name: 'Funny',
            tag: 'fun-theme'
        }
    ];

    constructor(@Inject(DOCUMENT) private doc: Document) {
        this._activeThemeData = this.themes[0];
        this._activeTheme = new BehaviorSubject(this._activeThemeData);
        this.activeTheme$ = this._activeTheme.asObservable();
    }
    ngOnInit(): void {
        /* apply default theme */
        this.applyTheme();
    }

    /* public functions */
    setTheme(newTheme: TTTheme) {
        if (newTheme.name != this._activeThemeData.name) {
            this._activeThemeData = newTheme;
            this._activeTheme.next(newTheme);
            this.applyTheme();
        }
    }

    /* private functions */
    private applyTheme() {
        const themesToRemove = this.themes.filter((_) => _.tag.length > 0).map((_) => _.tag);
        if(themesToRemove.length > 0){
            this.doc.body.classList.remove(...themesToRemove);
        }
        if(this._activeThemeData.tag.length > 0){
            this.doc.body.classList.add(this._activeThemeData.tag);
        }
    }
}