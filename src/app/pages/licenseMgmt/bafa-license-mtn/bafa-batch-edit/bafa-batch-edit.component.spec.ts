import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BafaBatchEditComponent } from './bafa-batch-edit.component';

describe('BafaBatchEditComponent', () => {
  let component: BafaBatchEditComponent;
  let fixture: ComponentFixture<BafaBatchEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BafaBatchEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BafaBatchEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
