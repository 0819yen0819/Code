import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateInputHandlerService {
  private dateString: string;
  constructor() {
    this.dateString = '';
  }

  concat(value: string): void {
    if (value) {
      if (new RegExp(/\d/g).test(value)) {
        this.dateString = this.dateString.concat(value);
      }
    } else {
      this.dateString = this.dateString.substring(
        0,
        this.dateString.length - 1
      );
    }
  }

  getDate(): Date | null {
    if (this.dateString.length === 8) {
      if (
        Date.parse(
          `${this.dateString.substring(0, 4)}/${this.dateString.substring(
            4,
            6
          )}/${this.dateString.substring(6, 8)}`
        )
      ) {
        return new Date(
          new Date(
            new Date().setFullYear(
              parseInt(this.dateString.substring(0, 4)),
              parseInt(this.dateString.substring(4, 6)) - 1,
              parseInt(this.dateString.substring(6, 8))
            )
          ).setHours(0, 0, 0, 0)
        );
      }
      return null;
    } else {
      return null;
    }
  }

  clean(): void {
    this.dateString = '';
  }
}
