import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewHistoryPopupComponent } from './view-history-popup.component';

describe('ViewHistoryPopupComponent', () => {
  let component: ViewHistoryPopupComponent;
  let fixture: ComponentFixture<ViewHistoryPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewHistoryPopupComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewHistoryPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
