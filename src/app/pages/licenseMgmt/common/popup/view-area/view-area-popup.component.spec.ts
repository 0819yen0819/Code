import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAreaPopupComponent } from './view-area-popup.component';

describe('ViewAreaPopupComponent', () => {
  let component: ViewAreaPopupComponent;
  let fixture: ComponentFixture<ViewAreaPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewAreaPopupComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewAreaPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
