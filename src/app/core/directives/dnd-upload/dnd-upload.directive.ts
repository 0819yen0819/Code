import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[dndUploadHandler]'
})
export class DndUploadDirective {

  constructor() { }

  @Input() acceptDropFileType:string = ''; // ex. ".xlsx,.csv,.xls"
  @Input() allowMulitUpload:boolean = false;
  @Input() maxFileSize:number = 40 * 1024 * 1024; // default 4MB
  @Output() fileDropped = new EventEmitter<any>(); // file drop 事件接口
  @Output() onFileDroppedError =  new EventEmitter<any>(); // 本directive拋出錯誤時的統一接口

  // Dragover listener
  @HostListener('dragover', ['$event']) onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  // Dragleave listener
  @HostListener('dragleave', ['$event']) public onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  // Drop listener
  @HostListener('drop', ['$event']) public ondrop(evt) {
    evt.preventDefault();
    evt.stopPropagation(); 

    // 使用者未預設傳入格式，使得所有類型的檔案都可以上傳
    if (this.acceptDropFileType.length === 0){ console.log('dnd allow all file type')}

    // 預設僅可上傳單一檔案，上傳多檔案時終止流程並拋出錯誤
    if (!this.allowMulitUpload && evt.dataTransfer.files.length > 1){return this.onFileDroppedError.emit('SampleOutDPL.Message.NotAllowMulitpleFileUpload');}
     
    // 上傳檔案類型與預設類型不符時終止流程並拋出錯誤
    let unexceptTypes = Array.from(evt.dataTransfer.files).filter((file:any)=>{return !this.isAcceptType(file)}); 
    if (unexceptTypes.length > 0){return this.onFileDroppedError.emit('SampleOutDPL.Message.NotAllowThisUploadFileType') };

    // 上傳檔案大小過大時拋出錯誤
    let unexceptSize = Array.from(evt.dataTransfer.files).filter((file:any)=>{return !this.isAcceptSize(file)}); 
    if (unexceptSize.length > 0){return this.onFileDroppedError.emit('SampleOutDPL.Message.FileSizeExceed') };

    // 回傳正確檔案
    let acceptFiles = Array.from(evt.dataTransfer.files).filter((file:any)=>{return this.isAcceptType(file)}); 
    if (acceptFiles.length > 0) { this.fileDropped.emit({'files':acceptFiles} );}
  }

  isAcceptType(file:File){ 
    const fileType = file.name?.split('.')?.pop() || ''; 
    return this.acceptDropFileType.split(',').includes('.' + fileType) || this.acceptDropFileType === '';
  }

  isAcceptSize(file:File){  
    return file.size < this.maxFileSize;
  }
}
