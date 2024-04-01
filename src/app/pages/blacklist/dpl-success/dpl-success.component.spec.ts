import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DplSuccessComponent } from './dpl-success.component';

describe('DplSuccessComponent', () => {
  let component: DplSuccessComponent;
  let fixture: ComponentFixture<DplSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DplSuccessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DplSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
