import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccordionStepchartComponent } from './accordion-stepchart.component';

describe('AccordionStepchartComponent', () => {
  let component: AccordionStepchartComponent;
  let fixture: ComponentFixture<AccordionStepchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccordionStepchartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccordionStepchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
