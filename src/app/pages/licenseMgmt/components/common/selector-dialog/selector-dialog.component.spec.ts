import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemSelectorDialogComponent } from './selector-dialog.component';

describe('ItemSelectorDialogComponent', () => {
  let component: ItemSelectorDialogComponent;
  let fixture: ComponentFixture<ItemSelectorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemSelectorDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemSelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
