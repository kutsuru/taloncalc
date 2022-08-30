import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TtPageLoaderService } from './tt-page-loader.service';
import { TtPageLoaderComponent } from './tt-page-loader.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  imports: [CommonModule, MatProgressSpinnerModule, FlexLayoutModule],
  declarations: [TtPageLoaderComponent],
  providers: [TtPageLoaderService],
  exports: [TtPageLoaderComponent],
})
export class TtPageLoaderModule {}
