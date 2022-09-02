import { Component, Input } from "@angular/core";
import { ttCollapseAnimations } from "./tt-collapse-animations";
import { TtCollapseContainerComponent } from "./tt-collapse-container.component";

@Component({
    selector: 'tt-collapse-indicator',
    template: '<mat-icon [@buttonRotate]="container.animationState">expand_more</mat-icon>',
    animations: [ttCollapseAnimations.indicatorRotate],
})
export class TtCollapseIndicactorComponent{
    @Input() container!: TtCollapseContainerComponent;
}