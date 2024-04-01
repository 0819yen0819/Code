import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmImpItemDialogComponent } from './am-imp-item-dialog.component';

describe('AmImpItemDialogComponent', () => {
  let component: AmImpItemDialogComponent;
  let fixture: ComponentFixture<AmImpItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AmImpItemDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmImpItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
