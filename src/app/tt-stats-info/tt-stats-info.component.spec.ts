import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtStatsInfoComponent } from './tt-stats-info.component';

describe('TtStatsInfoComponent', () => {
  let component: TtStatsInfoComponent;
  let fixture: ComponentFixture<TtStatsInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TtStatsInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtStatsInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
