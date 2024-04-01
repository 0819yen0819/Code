import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DplEndCustComponent } from './dpl-end-cust.component';

describe('DplEndCustComponent', () => {
  let component: DplEndCustComponent;
  let fixture: ComponentFixture<DplEndCustComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DplEndCustComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DplEndCustComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
