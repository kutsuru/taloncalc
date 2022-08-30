import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class TtPageLoaderService {
  private _counter: number = 0;
  private _show: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly show$ = this._show.asObservable();

  constructor() {}

  enable() {
    this._counter++;
    if (!this._show.value && this._counter > 0) {
      this._show.next(true);
    }
  }
  disable() {
    this._counter--;
    if (this._counter < 0) this._counter = 0;
    if (this._show.value && this._counter == 0) {
      this._show.next(false);
    }
  }
}
