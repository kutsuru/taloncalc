import { Component, Input, OnInit } from '@angular/core';
import { ttCollapseAnimations } from './tt-collapse-animations';
import { TtCollapseContainerComponent } from './tt-collapse-container.component';

@Component({
  selector: 'tt-collapse-button',
  template: `<button mat-icon-button (click)="container.toggle()" [@buttonRotate]="container.animationState">
      <mat-icon>expand_more</mat-icon>
    </button>`,
  animations: [ttCollapseAnimations.indicatorRotate],
})
export class TtCollapseButtonComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  @Input() container!: TtCollapseContainerComponent;
}
