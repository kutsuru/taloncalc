import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtBattleCalcV3Component } from './tt-battle-calc-v3.component';

describe('TtBattleCalcV3Component', () => {
  let component: TtBattleCalcV3Component;
  let fixture: ComponentFixture<TtBattleCalcV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtBattleCalcV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtBattleCalcV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
