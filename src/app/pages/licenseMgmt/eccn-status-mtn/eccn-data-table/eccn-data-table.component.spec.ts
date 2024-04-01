import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EccnDataTableComponent } from './eccn-data-table.component';

describe('EccnDataTableComponent', () => {
  let component: EccnDataTableComponent;
  let fixture: ComponentFixture<EccnDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EccnDataTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EccnDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
