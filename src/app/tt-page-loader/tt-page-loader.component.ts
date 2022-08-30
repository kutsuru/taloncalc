import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { TtPageLoaderService } from './tt-page-loader.service';

@Component({
  selector: 'tt-page-loader',
  templateUrl: 'tt-page-loader.component.html',
  styleUrls: ['tt-page-loader.component.scss'],
})
export class TtPageLoaderComponent {
  showLoader$: Observable<boolean>;

  constructor(private loaderService: TtPageLoaderService) {
    this.showLoader$ = this.loaderService.show$;
  }
}
