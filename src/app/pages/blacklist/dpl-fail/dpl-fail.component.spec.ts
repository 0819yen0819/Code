import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DplFailComponent } from './dpl-fail.component';

describe('DplFailComponent', () => {
  let component: DplFailComponent;
  let fixture: ComponentFixture<DplFailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DplFailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DplFailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
