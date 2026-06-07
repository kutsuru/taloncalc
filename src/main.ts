import { enableProdMode, provideZonelessChangeDetection } from '@angular/core';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MAT_RIPPLE_GLOBAL_OPTIONS, RippleGlobalOptions } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { FilteredKeyValuePipe } from './app/core/filtered-key-value.pipe';
import { TtLvArrayPipe } from './app/core/tt-lv-array.pipe';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

const globalRippleConfig: RippleGlobalOptions = {
  terminateOnPointerUp: true
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    FilteredKeyValuePipe,
    TtLvArrayPipe,
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: globalRippleConfig }
  ]
})
  .catch((err) => console.error(err));
