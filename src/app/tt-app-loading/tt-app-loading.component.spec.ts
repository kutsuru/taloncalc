import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtAppLoadingComponent } from './tt-app-loading.component';

describe('TtAppLoadingComponent', () => {
  let component: TtAppLoadingComponent;
  let fixture: ComponentFixture<TtAppLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtAppLoadingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtAppLoadingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
