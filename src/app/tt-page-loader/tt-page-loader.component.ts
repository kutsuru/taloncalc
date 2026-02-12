import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { TtPageLoaderService } from './tt-page-loader.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'tt-page-loader',
    templateUrl: 'tt-page-loader.component.html',
    styleUrls: ['tt-page-loader.component.scss'],
    standalone: true,
    imports: [
        NgIf,
        MatProgressSpinner,
        AsyncPipe,
    ],
})
export class TtPageLoaderComponent {
  showLoader$: Observable<boolean>;

  constructor(private loaderService: TtPageLoaderService) {
    this.showLoader$ = this.loaderService.show$;
  }
}
