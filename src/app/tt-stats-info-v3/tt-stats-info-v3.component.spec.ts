import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtStatsInfoV3Component } from './tt-stats-info-v3.component';

describe('TtStatsInfoV3Component', () => {
  let component: TtStatsInfoV3Component;
  let fixture: ComponentFixture<TtStatsInfoV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtStatsInfoV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtStatsInfoV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
