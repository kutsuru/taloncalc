import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtPassiveComponent } from './tt-passive.component';

describe('TtPassiveComponent', () => {
  let component: TtPassiveComponent;
  let fixture: ComponentFixture<TtPassiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtPassiveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TtPassiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
