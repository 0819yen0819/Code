import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovingDplEndCustComponent } from './approving-dpl-end-cust.component';

describe('ApprovingDplEndCustComponent', () => {
  let component: ApprovingDplEndCustComponent;
  let fixture: ComponentFixture<ApprovingDplEndCustComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApprovingDplEndCustComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovingDplEndCustComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
