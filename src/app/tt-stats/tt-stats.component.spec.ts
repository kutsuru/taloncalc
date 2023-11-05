import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtStatsComponent } from './tt-stats.component';

describe('TtStatsComponent', () => {
  let component: TtStatsComponent;
  let fixture: ComponentFixture<TtStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TtStatsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
