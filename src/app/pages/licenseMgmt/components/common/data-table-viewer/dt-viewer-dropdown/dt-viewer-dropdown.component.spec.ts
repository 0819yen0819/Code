import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DtViewerDropdownComponent } from './dt-viewer-dropdown.component';

describe('DtViewerDropdownComponent', () => {
  let component: DtViewerDropdownComponent;
  let fixture: ComponentFixture<DtViewerDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DtViewerDropdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DtViewerDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
