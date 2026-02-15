/*** imports ***/
import { Component, computed, inject } from '@angular/core';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';

/*** types ***/

/*** definitons ***/
const BASE_PATH = '/assets/jobs';
const MAPPING = {
  'Swordman High': 'Swordman',
  'Mage High': 'Mage',
  'Archer High': 'Archer',
  'Acolyte High': 'Acolyte',
  'Merchant High': 'Merchant',
  'Thief High': 'Thief',
}

/*** component ***/
@Component({
  selector: 'class-avatar',
  imports: [],
  templateUrl: './class-avatar.component.html',
  styleUrl: './class-avatar.component.scss',
})
export class ClassAvatarComponent {
  private readonly _session = inject(TTSessionInfoV3Service);

  classImg = computed(() => {
    const className = this._session.jobClassName();
    let url: string;
    if (className in MAPPING) {
      url = `${BASE_PATH}/${MAPPING[className]}.png`;
    }
    else {
      url = `${BASE_PATH}/${className}.png`;

    }
    return url;
  })
}