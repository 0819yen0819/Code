import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmExpItemDialogComponent } from './am-exp-item-dialog.component';

describe('AmExpItemDialogComponent', () => {
  let component: AmExpItemDialogComponent;
  let fixture: ComponentFixture<AmExpItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AmExpItemDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmExpItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
