import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ObjectFormatService {
  constructor() {}

  private convertDateForIos(date: Date | string | number): Date {
    if (typeof date == 'number') {
      return new Date(date);
    } else {
      let dateString = date.toString();
      //# for safari
      return new Date(dateString.replace('-', '/'));
    }
  }

  ParseThousandFormat(value: string | number | null): string | null {
    if (value) {
      const paramStr = value.toString();
      //# for safari
      const regExp = new RegExp('\\B(?<!\\.\\d*)(?=(\\d{3})+(?!\\d))', 'g');

      if (paramStr.length > 3) {
        return paramStr.replace(regExp, ',');
      }
      return paramStr;
    }
    return;
  }

  RecorveryThousandFormat(value: string | number | null): number | null {
    if (value) {
      const paramStr = value.toString()?.split(',').join('');
      return parseFloat(paramStr);
    }
    return;
  }

  ObjectClean(data: object): any {
    Object.keys(data).forEach(
      (key) =>
        (data[key] === undefined || data[key] === null || data[key] === '') &&
        delete data[key]
    );
    return data;
  }

  DateFormat(date: Date | string | number, splitSymbol: string = '-') {
    if (date == null) return null;
    const d = this.convertDateForIos(date);
    let year = `${d.getFullYear()}`;
    let month = `${d.getMonth() + 1}`;
    let day = `${d.getDate()}`;

    if (month.length < 2) {
      month = `0${month}`;
    }
    if (day.length < 2) {
      day = `0${day}`;
    }

    return `${year}${splitSymbol}${month}${splitSymbol}${day}`;
  }

  DateTimeFormat(date: Date | string | number, splitSymbol: string = '-') {
    if (date == null) return null;
    const d = this.convertDateForIos(date);
    let year = `${d.getFullYear()}`;
    let month = `${d.getMonth() + 1}`;
    let day = `${d.getDate()}`;
    let hours = `${d.getHours()}`;
    let mins = `${d.getMinutes()}`;
    let secs = `${d.getSeconds()}`;

    if (month.length < 2) {
      month = `0${month}`;
    }
    if (day.length < 2) {
      day = `0${day}`;
    }

    if (hours.length < 2) {
      hours = `0${hours}`;
    }
    if (mins.length < 2) {
      mins = `0${mins}`;
    }

    if (secs.length < 2) {
      secs = `0${secs}`;
    }

    return `${year}${splitSymbol}${month}${splitSymbol}${day} ${hours}:${mins}:${secs}`;
  }

  TimeFormat(date: Date | string | number) {
    if (date == null) return null;
    const d = this.convertDateForIos(date);
    let hours = `${d.getHours()}`;
    let mins = `${d.getMinutes()}`;
    let secs = `${d.getSeconds()}`;

    if (hours.length < 2) {
      hours = `0${hours}`;
    }
    if (mins.length < 2) {
      mins = `0${mins}`;
    }
    if (secs.length < 2) {
      secs = `0${secs}`;
    }

    return `${hours}:${mins}:${secs}`;
  }
}
