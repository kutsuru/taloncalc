import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtStatsV3Component } from './tt-stats-v3.component';

describe('TtStatsV3Component', () => {
  let component: TtStatsV3Component;
  let fixture: ComponentFixture<TtStatsV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtStatsV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtStatsV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
