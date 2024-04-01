import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
    providedIn: 'root',
})
/**
 * Toast service class
 * This class provides methods to add single, multiple alerts as a toast
 */
export class ToastService {
    constructor(
      private messageService: MessageService) { }

    info(detail: string, sticky?: boolean, key?: string) {
      this.addSingle('info', 'Info', detail, sticky, key);
    }

    success(detail: string, sticky?: boolean, key?: string) {
      this.addSingle('success', 'Success', detail, sticky, key);
    }

    warn(detail: string, sticky?: boolean, key?: string) {
      this.addSingle('warn', 'Warn', detail, sticky, key);
    }

    error(detail: string, key?: string) {
      this.addSingle('error', 'Error', detail, true, key);
    }

    /**
     * add single toast message
     * @param severity Severity level of the message, valid values are "success", "info", "warn" and "error"
     * @param summary Summary text of the message.
     * @param detail Detail text of the message.
     * @param sticky Whether the message should be automatically closed based on life property or kept visible.
     * @param key Key of the message in case message is targeted to a specific toast component.
     */
    addSingle(severity: string, summary: string, detail: string, sticky?: boolean, key?: string) {
        this.messageService.add({
          severity: severity,
          summary: summary,
          detail: detail,
          sticky: sticky,
          key: key
        });
    }

    /**
     * add multiple toast messages
     * @param messages
     * array of message type {severity:'success', summary:'Service Message', detail:'Via MessageService'}
     */
    addMultiple(messages: any) {
        this.messageService.addAll(messages);
    }

    /**
     * clear all toast messages
     */
    clear() {
        this.messageService.clear();
    }
}
