import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveDplFailComponent } from './approve-dpl-fail.component';

describe('ApproveDplFailComponent', () => {
  let component: ApproveDplFailComponent;
  let fixture: ComponentFixture<ApproveDplFailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApproveDplFailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveDplFailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
