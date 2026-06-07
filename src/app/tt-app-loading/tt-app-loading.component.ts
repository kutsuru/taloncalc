import { Component, inject, OnInit } from '@angular/core';
import { TTCoreServiceV3 } from '../core/tt-core.v3.service';
import { TtPageLoaderService } from '../core/tt-page-loader.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-tt-app-loading',
  imports: [MatProgressSpinnerModule, MatCardModule],
  templateUrl: './tt-app-loading.component.html',
  styleUrl: './tt-app-loading.component.scss',
})
export class TtAppLoadingComponent implements OnInit {
  /* injects */
  readonly #core = inject(TTCoreServiceV3);
  readonly loader = inject(TtPageLoaderService);

  ngOnInit(): void {
    /* start loading the core */
    this.#core.initializeCore();
  }
}
