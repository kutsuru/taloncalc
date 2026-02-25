import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtBuffV3Component } from './tt-buff-v3.component';

describe('TtBuffV3Component', () => {
  let component: TtBuffV3Component;
  let fixture: ComponentFixture<TtBuffV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtBuffV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtBuffV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
