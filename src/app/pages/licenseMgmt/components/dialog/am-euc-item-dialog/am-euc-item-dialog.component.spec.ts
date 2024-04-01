import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmEucItemDialogComponent } from './am-euc-item-dialog.component';

describe('AmEucItemDialogComponent', () => {
  let component: AmEucItemDialogComponent;
  let fixture: ComponentFixture<AmEucItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AmEucItemDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmEucItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
