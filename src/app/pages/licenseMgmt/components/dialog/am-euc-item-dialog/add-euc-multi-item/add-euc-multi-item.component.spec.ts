import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiItemAddComponent } from './add-euc-multi-item.component';

describe('MultiItemAddComponent', () => {
  let component: MultiItemAddComponent;
  let fixture: ComponentFixture<MultiItemAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultiItemAddComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiItemAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
