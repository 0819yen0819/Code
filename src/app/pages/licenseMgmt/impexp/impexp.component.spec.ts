import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpexpComponent } from './impexp.component';

describe('ImpexpComponent', () => {
  let component: ImpexpComponent;
  let fixture: ComponentFixture<ImpexpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpexpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpexpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
