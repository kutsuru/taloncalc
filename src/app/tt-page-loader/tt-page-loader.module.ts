import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TtPageLoaderService } from './tt-page-loader.service';
import { TtPageLoaderComponent } from './tt-page-loader.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  imports: [CommonModule, MatProgressSpinnerModule],
  declarations: [TtPageLoaderComponent],
  providers: [TtPageLoaderService],
  exports: [TtPageLoaderComponent],
})
export class TtPageLoaderModule { }
