import { Component, OnInit } from '@angular/core';
import { ttCollapseAnimations } from './tt-collapse-animations';

@Component({
  selector: '[tt-collapse-container]',
  template: '<ng-content></ng-content>',
  animations: [ttCollapseAnimations.containerExpansion],
  host: {
    '[@containerExpansion]': '_animationState',
  },
})
export class TtCollapseContainerComponent implements OnInit {
  /* attributes */
  private _isCollapsed: boolean = false;
  private _animationState: 'open' | 'close' | 'open-instant' = 'open';
  private _enableAnimation: boolean = true;

  constructor() {}

  ngOnInit() {}

  /* GET/SET functions */
  get isCollapsed(): boolean {
    return this._isCollapsed;
  }
  get animationState() {
    return this._animationState;
  }

  /* public functions */
  open() {
    this.toggle(false);
  }
  close() {
    this.toggle(true);
  }
  toggle(isCollapsed: boolean = !this._isCollapsed) {
    this._isCollapsed = isCollapsed;

    if (isCollapsed) {
      this._animationState = 'close';
    } else if (this._enableAnimation) {
      this._animationState = 'open';
    } else {
      this._animationState = 'open-instant';
    }
  }
}
