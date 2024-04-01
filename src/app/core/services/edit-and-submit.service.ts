import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EditAndSubmitService {

  constructor() { }

  get style(){
    return {'background-color': '#47B8DB'};
  } 
}
