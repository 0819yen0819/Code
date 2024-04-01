import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { FileUploaderManager } from 'src/app/core/model/file-uploader';
import { MyFlowService } from 'src/app/core/services/my-flow.service';

@Injectable({
  providedIn: 'root'
})
export class AttachUploadDialogService {

  constructor(
    private translateService: TranslateService,
    private myFlowService: MyFlowService
  ) { }


  getDefaultUploadSetting() {
    const defaultSetting = new FileUploaderManager();
    defaultSetting.multiple = true;
    defaultSetting.fileLimit = null;
    defaultSetting.chooseLabel = this.translateService.instant('LicenseMgmt.Common.Hint.AddFileCKMe');
    defaultSetting.maxFileSize = 40 * 1024 * 1024;
    defaultSetting.showUploadButton = true;
    defaultSetting.accept = '';
    return defaultSetting
  }

  URLisValid(url: string): boolean {
    if (url === undefined || !url) return false;
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    var res = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return res !== null;
  }

  fileIsValid(file: File, acceptFileType: string = '', maxFileSize: number = 40 * 1024 * 1024) {
    const fileType = file.name?.split('.')?.pop() || '';
    const fileSizeAccept = file.size < maxFileSize;
    const fileTypeAccept = acceptFileType.split(',').includes('.' + fileType) || acceptFileType === '';
    if (!fileSizeAccept) { return this.translateService.instant('SampleOutDPL.Message.FileSizeExceed'); }
    if (!fileTypeAccept) { return this.translateService.instant('SampleOutDPL.Message.NotAllowThisUploadFileType'); }
    return;
  }

  uploadFile(formNo, file) {
    return lastValueFrom(this.myFlowService.uploadFile(formNo, file));
  }

  uploadUrl(formTypeId, formNo, url) {
    return lastValueFrom(this.myFlowService.uploadFormFileUrl({ formNo: formNo, url: url, formTypeId: formTypeId }));
  }

  addFormFile(model) {
    return lastValueFrom(this.myFlowService.addFormFile(model));
  }
}
