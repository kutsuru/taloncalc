import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtBuffComponent } from './tt-buff.component';

describe('TtBuffComponent', () => {
  let component: TtBuffComponent;
  let fixture: ComponentFixture<TtBuffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtBuffComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TtBuffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
