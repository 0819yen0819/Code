import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommomByTypeSelectorComponent } from './by-type-selector.component';

describe('CommomByTypeSelectorComponent', () => {
  let component: CommomByTypeSelectorComponent;
  let fixture: ComponentFixture<CommomByTypeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommomByTypeSelectorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommomByTypeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
