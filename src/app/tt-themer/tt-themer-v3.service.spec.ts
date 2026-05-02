import { TestBed } from '@angular/core/testing';

import { TtThemerV3Service } from './tt-themer-v3.service';

describe('TtThemerV3Service', () => {
  let service: TtThemerV3Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TtThemerV3Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
