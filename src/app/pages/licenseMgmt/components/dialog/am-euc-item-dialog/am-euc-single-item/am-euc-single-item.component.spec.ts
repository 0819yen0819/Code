import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmEucSingleItemAddComponent } from './am-euc-single-item.component';

describe('AmEucSingleItemAddComponent', () => {
  let component: AmEucSingleItemAddComponent;
  let fixture: ComponentFixture<AmEucSingleItemAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AmEucSingleItemAddComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmEucSingleItemAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
