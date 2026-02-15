import { Component, inject } from '@angular/core';
import { TTSessionInfoV3Service } from '../core/tt-session-info.v3.service';
import { TtValueComponent } from "../tt-value/tt-value.component";

@Component({
  selector: 'tt-stats-info-v3',
  imports: [TtValueComponent],
  templateUrl: './tt-stats-info-v3.component.html',
  styleUrl: './tt-stats-info-v3.component.scss',
})
export class TtStatsInfoV3Component {
  readonly session = inject(TTSessionInfoV3Service);
}
