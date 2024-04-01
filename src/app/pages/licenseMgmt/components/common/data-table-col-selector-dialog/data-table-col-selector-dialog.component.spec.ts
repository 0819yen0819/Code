import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableColSelectorComponent } from './data-table-col-selector-dialog.component';

describe('DataTableColSelectorComponent', () => {
  let component: DataTableColSelectorComponent;
  let fixture: ComponentFixture<DataTableColSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataTableColSelectorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTableColSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
