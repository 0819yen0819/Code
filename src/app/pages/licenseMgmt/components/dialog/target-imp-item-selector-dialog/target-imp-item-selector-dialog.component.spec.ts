import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetImpItemSelectorDialogComponent } from './target-imp-item-selector-dialog.component';

describe('TargetImpItemSelectorDialogComponent', () => {
  let component: TargetImpItemSelectorDialogComponent;
  let fixture: ComponentFixture<TargetImpItemSelectorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TargetImpItemSelectorDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TargetImpItemSelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
