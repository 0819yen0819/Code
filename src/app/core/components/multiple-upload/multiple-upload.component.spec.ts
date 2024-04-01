import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleUploadComponent } from './multiple-upload.component';

describe('MultipleUploadComponent', () => {
  let component: MultipleUploadComponent;
  let fixture: ComponentFixture<MultipleUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultipleUploadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
