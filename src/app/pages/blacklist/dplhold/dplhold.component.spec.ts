import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DPLHoldComponent } from './dplhold.component';

describe('DPLHoldComponent', () => {
  let component: DPLHoldComponent;
  let fixture: ComponentFixture<DPLHoldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DPLHoldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DPLHoldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
