import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtPassiveV3Component } from './tt-passive-v3.component';

describe('TtPassiveV3Component', () => {
  let component: TtPassiveV3Component;
  let fixture: ComponentFixture<TtPassiveV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtPassiveV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtPassiveV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
