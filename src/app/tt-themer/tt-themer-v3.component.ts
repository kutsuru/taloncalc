import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TtThemerV3Service } from './tt-themer-v3.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'tt-themer-v3',
  imports: [MatIconModule, MatButtonModule,MatTooltipModule],
  templateUrl: './tt-themer-v3.component.html',
  styleUrl: './tt-themer-v3.component.scss',
})
export class TtThemerV3Component {
  /* injects */
  readonly themer = inject(TtThemerV3Service);

  /* signals */
  icon = computed(() => {
    return this.themer.isDarkMode() ? 'light_mode' : 'dark_mode';
  });
  hover = computed(() => {
    return this.themer.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
}