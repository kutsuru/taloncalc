import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TtCollapseContainerComponent } from './tt-collapse-container.component';
import { TtCollapseButtonComponent } from './tt-collapse-button.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  imports: [CommonModule, MatIconModule, MatButtonModule],
  declarations: [TtCollapseContainerComponent, TtCollapseButtonComponent],
  exports: [TtCollapseButtonComponent, TtCollapseContainerComponent],
})
export class TtCollapseModule {}
