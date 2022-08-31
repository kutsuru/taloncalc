import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtSettingsComponent } from './tt-settings.component';

describe('TtSettingsComponent', () => {
  let component: TtSettingsComponent;
  let fixture: ComponentFixture<TtSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TtSettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
