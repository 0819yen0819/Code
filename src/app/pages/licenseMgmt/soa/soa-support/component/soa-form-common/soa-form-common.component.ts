import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AttachedLink } from 'src/app/core/model/attached-add-about';
import { SoaCommonService } from '../../../soa-common.service';
import { environment } from 'src/environments/environment';
import { IntegrateService } from 'src/app/core/services/integrate.service';

@Component({
  selector: 'app-soa-form-common',
  templateUrl: './soa-form-common.component.html',
  styleUrls: ['./soa-form-common.component.scss']
})
export class SoaFormCommonComponent implements OnInit {
  formGroup: FormGroup

  attachedLinkList: BehaviorSubject<AttachedLink[]> = new BehaviorSubject<AttachedLink[]>([]);
  attachedFileList: BehaviorSubject<File[]> = new BehaviorSubject<File[]>([]);;

  @Output() btnClick = new EventEmitter<string>(); // file drop 事件接口
  @Output() formCommonData = new EventEmitter<any>();
  opinionData // 意見

  constructor(
    private formbuilder: FormBuilder,
    public soaCommonService: SoaCommonService,
    private router: Router,
    public integrateService:IntegrateService
  ) { }

  ngOnInit(): void {
    this.formGroup = this.formbuilder.group({
      comment: [null],
    });;
    this.recoverData();
  }

  async recoverData() {
    if (this.soaCommonService.currentState === 'Apply') { return; }
    const rsp = this.soaCommonService.getSOAFormData();
    this.integrateService.init(rsp.formTypeId);
  }

  onAttachedLinkHandler(data: AttachedLink[]): void {
    this.attachedLinkList.next(data);
  }

  onAttachedFileHandler(data: File[]): void {
    this.attachedFileList.next(data);
    this.emitFormCommon();
  }

  onFormSubmit(mode: string) {
    this.btnClick.emit(mode);
  }

  textAreaChange() {
    this.emitFormCommon();
  }

  emitFormCommon() {
    this.formCommonData.emit({
      opinion: this.opinionData,
      fileList: this.attachedFileList.getValue()
    });
  } 
}
