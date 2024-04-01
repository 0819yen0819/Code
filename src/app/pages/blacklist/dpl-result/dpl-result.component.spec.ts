import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DplResultComponent } from './dpl-result.component';

describe('DplResultComponent', () => {
  let component: DplResultComponent;
  let fixture: ComponentFixture<DplResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DplResultComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DplResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
