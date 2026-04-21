import { Pipe, PipeTransform } from "@angular/core";

export type TTURLTypes = 'icon';

@Pipe({ name: 'talonurl' })
export class TTTalonURLPipe implements PipeTransform {
    transform(value: number | string, urlType: TTURLTypes = 'icon') {
        switch (urlType) {
            case 'icon':
                return `https://talontales.com/panel/data/items/icons/${value}.png`;
        }
    }
}