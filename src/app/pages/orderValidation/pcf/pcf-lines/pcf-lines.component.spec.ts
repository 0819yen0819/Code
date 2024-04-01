import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcfLinesComponent } from './pcf-lines.component';

describe('PcfLinesComponent', () => {
  let component: PcfLinesComponent;
  let fixture: ComponentFixture<PcfLinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PcfLinesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PcfLinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
