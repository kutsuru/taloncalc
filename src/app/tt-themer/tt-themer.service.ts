import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, OnInit } from "@angular/core";

interface TTTheme {
    name: string,
    tag: string
}

@Injectable({
    providedIn: 'root'
})
export class TTThemerService implements OnInit {
    /* current theme */
    private _activeTheme: TTTheme;
    get activeTheme() {
        return this._activeTheme;
    }
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
        this._activeTheme = this.themes[0];
    }
    ngOnInit(): void {
        /* apply default theme */
        this.applyTheme();
    }

    /* public functions */
    setTheme(newTheme: TTTheme) {
        if (newTheme.name != this._activeTheme.name) {
            this._activeTheme = newTheme;
            this.applyTheme();
        }
    }

    /* private functions */
    private applyTheme() {
        const themesToRemove = this.themes.filter((_) => _.tag.length > 0).map((_) => _.tag);
        if(themesToRemove.length > 0){
            this.doc.body.classList.remove(...themesToRemove);
        }
        if(this.activeTheme.tag.length > 0){
            this.doc.body.classList.add(this._activeTheme.tag);
        }
    }
}