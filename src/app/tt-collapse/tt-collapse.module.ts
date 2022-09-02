import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TtCollapseContainerComponent } from './tt-collapse-container.component';
import { TtCollapseButtonComponent } from './tt-collapse-button.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TtCollapseTriggerDirective } from './tt-collapse-trigger.directive';
import { TtCollapseIndicactorComponent } from './tt-collapse-indicator.component';

@NgModule({
  imports: [CommonModule, MatIconModule, MatButtonModule],
  declarations: [
    TtCollapseContainerComponent,
    TtCollapseButtonComponent,
    TtCollapseTriggerDirective,
    TtCollapseIndicactorComponent
  ],
  exports: [
    TtCollapseButtonComponent,
    TtCollapseContainerComponent,
    TtCollapseTriggerDirective,
    TtCollapseIndicactorComponent
  ],
})
export class TtCollapseModule { }