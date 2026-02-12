import { enableProdMode, provideZoneChangeDetection } from '@angular/core';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FilteredKeyValuePipe } from './app/core/filtered-key-value.pipe';
import { TtLvArrayPipe } from './app/core/tt-lv-array.pipe';
import { environment } from './environments/environment';


import { AppComponent } from './app/app.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
    provideZoneChangeDetection(),FilteredKeyValuePipe, TtLvArrayPipe, provideHttpClient(withInterceptorsFromDi()),
    provideAnimations()
]
})
  .catch((err) => console.error(err));
