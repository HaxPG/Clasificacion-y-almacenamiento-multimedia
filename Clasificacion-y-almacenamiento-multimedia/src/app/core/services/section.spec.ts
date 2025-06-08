import { TestBed } from '@angular/core/testing';

import { Section } from './section';

describe('Section', () => {
  let service: Section;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Section);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
