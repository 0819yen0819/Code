import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpRefDataTableComponent } from './exp-ref-data-table.component';

describe('ExpRefDataTableComponent', () => {
  let component: ExpRefDataTableComponent;
  let fixture: ComponentFixture<ExpRefDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpRefDataTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpRefDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
