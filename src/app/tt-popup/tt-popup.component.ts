import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, EventEmitter, Input, OnDestroy } from '@angular/core';

/* types / defines */
type PopupAnimationStates = 'open' | 'closed';

/* class / component */
@Component({
  selector: 'tt-popup',
  templateUrl: 'tt-popup.component.html',
  styleUrls: ['tt-popup.component.scss'],
  animations: [
    trigger('slideInOut', [
      state(
        'closed',
        style({
          left: '100%',
          opacity: '0',
          visibility: 'hidden',
        })
      ),
      state(
        'open',
        style({
          left: '50%',
          opacity: '1',
          visibility: 'unset',
        })
      ),
      transition('open <=> closed', animate('1000ms ease-in-out')),
    ]),
  ],
  host: {
    '[@slideInOut]': 'animationState',
  },
})
export class TtPopupComponent implements OnDestroy {
  /* Icon name for the button to open the popup (material icon font) */
  @Input() icon: string = 'menu';

  /* animation state */
  animationState: PopupAnimationStates = 'closed';

  /* status if popup */
  private _isOpen: boolean = false;
  get isOpen() {
    return this._isOpen;
  }
  /* event emitter for popup groups */
  readonly opened: EventEmitter<TtPopupComponent> =
    new EventEmitter<TtPopupComponent>();
  readonly closed: EventEmitter<TtPopupComponent> =
    new EventEmitter<TtPopupComponent>();

  constructor() {}

  ngOnDestroy(): void {
    this.opened.complete();
    this.closed.complete();
  }
  setOpen(toOpen: boolean) {
    if (toOpen) {
      /* set to open */
      if (!this._isOpen) {
        this._isOpen = true;
        this.animationState = 'open';
        this.opened.emit(this);
      }
    } else {
      /* set to close */
      if (this._isOpen) {
        this._isOpen = false;
        this.animationState = 'closed';
        this.closed.emit(this);
      }
    }
  }

  toggle() {
    this.setOpen(!this._isOpen);
  }
}
