import { enableProdMode, provideZonelessChangeDetection } from '@angular/core';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FilteredKeyValuePipe } from './app/core/filtered-key-value.pipe';
import { TtLvArrayPipe } from './app/core/tt-lv-array.pipe';
import { environment } from './environments/environment';


import { AppComponent } from './app/app.component';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    FilteredKeyValuePipe,
    TtLvArrayPipe,
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }
  ]
})
  .catch((err) => console.error(err));
