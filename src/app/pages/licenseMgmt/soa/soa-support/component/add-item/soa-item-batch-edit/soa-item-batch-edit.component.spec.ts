import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaItemBatchEditComponent } from './soa-item-batch-edit.component';

describe('SoaItemBatchEditComponent', () => {
  let component: SoaItemBatchEditComponent;
  let fixture: ComponentFixture<SoaItemBatchEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaItemBatchEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaItemBatchEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
