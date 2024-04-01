import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaImportOuComponent } from './soa-import-ou.component';

describe('SoaImportOuComponent', () => {
  let component: SoaImportOuComponent;
  let fixture: ComponentFixture<SoaImportOuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaImportOuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaImportOuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
