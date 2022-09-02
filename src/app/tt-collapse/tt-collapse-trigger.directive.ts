import { Directive, Input, HostListener } from '@angular/core';
import { MatRipple } from '@angular/material/core';
import { TtCollapseContainerComponent } from './tt-collapse-container.component';

@Directive({
    selector:'[collapseTriggerFor]',
    host: {
        '[style.cursor]': '"pointer"'
    }
})
export class TtCollapseTriggerDirective extends MatRipple {
    @Input() collapseTriggerFor!: TtCollapseContainerComponent;
    @HostListener('click') onClick(){
        if(this.collapseTriggerFor){
            this.collapseTriggerFor.toggle();
        }
    }
}