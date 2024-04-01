import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableViewerComponent } from './data-table-viewer.component';

describe('DataTableViewerComponent', () => {
  let component: DataTableViewerComponent;
  let fixture: ComponentFixture<DataTableViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataTableViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTableViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
