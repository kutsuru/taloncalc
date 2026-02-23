import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtBattleCalcPvmV3Component } from './tt-battle-calc-pvm-v3.component';

describe('TtBattleCalcPvmV3Component', () => {
  let component: TtBattleCalcPvmV3Component;
  let fixture: ComponentFixture<TtBattleCalcPvmV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtBattleCalcPvmV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtBattleCalcPvmV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
