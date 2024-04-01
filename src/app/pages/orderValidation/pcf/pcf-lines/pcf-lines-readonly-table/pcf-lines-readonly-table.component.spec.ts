import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcfLinesReadonlyTableComponent } from './pcf-lines-readonly-table.component';

describe('PcfLinesReadonlyTableComponent', () => {
  let component: PcfLinesReadonlyTableComponent;
  let fixture: ComponentFixture<PcfLinesReadonlyTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PcfLinesReadonlyTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PcfLinesReadonlyTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
