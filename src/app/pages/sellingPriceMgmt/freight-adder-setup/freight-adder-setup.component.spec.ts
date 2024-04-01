import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreightAdderSetupComponent } from './freight-adder-setup.component';

describe('FreightAdderSetupComponent', () => {
  let component: FreightAdderSetupComponent;
  let fixture: ComponentFixture<FreightAdderSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FreightAdderSetupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FreightAdderSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
