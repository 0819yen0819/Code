import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpexpItemBatchHandlerComponent } from './impexp-item-batch-handler.component';

describe('ImpexpItemBatchHandlerComponent', () => {
  let component: ImpexpItemBatchHandlerComponent;
  let fixture: ComponentFixture<ImpexpItemBatchHandlerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpexpItemBatchHandlerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpexpItemBatchHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
