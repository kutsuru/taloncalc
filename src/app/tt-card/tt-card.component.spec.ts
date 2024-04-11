import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtCardComponent } from './tt-card.component';

describe('TtCardComponent', () => {
  let component: TtCardComponent;
  let fixture: ComponentFixture<TtCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TtCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
