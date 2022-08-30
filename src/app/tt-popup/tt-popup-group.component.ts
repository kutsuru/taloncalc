import {
  AfterViewInit,
  Component,
  ContentChildren,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TtPopupComponent } from './tt-popup.component';

@Component({
  selector: 'tt-popup-group',
  template: '<ng-content></ng-content>',
})
export class TtPopupGroupComponent implements AfterViewInit, OnInit, OnDestroy {
  /* event emitter */
  readonly _unsubscribeChilds$: Subject<void> = new Subject<void>();
  readonly _destroy$: Subject<void> = new Subject<void>();

  /* popup components */
  @ContentChildren(TtPopupComponent) popupChilds!: QueryList<TtPopupComponent>;
  private _openedPopups!: Set<TtPopupComponent>;
  private _closedPopups!: Set<TtPopupComponent>;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._unsubscribeChilds$.next();
    this._unsubscribeChilds$.complete();
    this._destroy$.next();
    this._destroy$.complete();
  }

  ngAfterViewInit(): void {
    /* collect opened/closed popups */
    this._openedPopups = new Set<TtPopupComponent>(
      this.popupChilds.filter((pop) => pop.isOpen)
    );
    this._closedPopups = new Set<TtPopupComponent>(
      this.popupChilds.filter((pop) => !pop.isOpen)
    );
    /* subscribe to changes of childs */
    this.popupChilds.changes.pipe(takeUntil(this._destroy$)).subscribe((_) => {
      this.subToChilds();
    });
    /* initialize the subs */
    this.subToChilds();
  }

  subToChilds() {
    /* cancel old subsciptions */
    this._unsubscribeChilds$.next();
    /* loop over popups and create subscriptions */
    this.popupChilds.forEach((pop) => {
      /* opend */
      pop.opened.pipe(takeUntil(this._unsubscribeChilds$)).subscribe((pop) => {
        /* close all opend popups */
        this._openedPopups.forEach((popDeep) => {
          popDeep.setOpen(false);
        });
        /* rearange lists */
        this._closedPopups.delete(pop);
        this._openedPopups.add(pop);
      });
      /* closed */
      pop.closed.pipe(takeUntil(this._unsubscribeChilds$)).subscribe((pop) => {
        /* rearange lists */
        this._openedPopups.delete(pop);
        this._closedPopups.add(pop);
      });
    });
  }
}
