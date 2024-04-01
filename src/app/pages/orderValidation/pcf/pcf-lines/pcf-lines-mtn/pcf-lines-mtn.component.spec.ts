import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcfLinesMtnComponent } from './pcf-lines-mtn.component';

describe('PcfLinesMtnComponent', () => {
  let component: PcfLinesMtnComponent;
  let fixture: ComponentFixture<PcfLinesMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PcfLinesMtnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PcfLinesMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
