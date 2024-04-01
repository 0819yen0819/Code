import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveDplholdComponent } from './approve-dplhold.component';

describe('ApproveDplholdComponent', () => {
  let component: ApproveDplholdComponent;
  let fixture: ComponentFixture<ApproveDplholdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApproveDplholdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveDplholdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
