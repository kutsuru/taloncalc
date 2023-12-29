import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattleCalcPvmComponent } from './battle-calc-pvm.component';

describe('BattleCalcPvmComponent', () => {
  let component: BattleCalcPvmComponent;
  let fixture: ComponentFixture<BattleCalcPvmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleCalcPvmComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BattleCalcPvmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
