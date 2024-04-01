import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[htmlCollapse]'
})
export class HtmlCollapseDirective implements OnInit, OnChanges {
  @Input() collapseController: boolean = true;

  constructor(private elementRef: ElementRef) { }

  get htmlEl() {
    return this.elementRef.nativeElement;
  }

  ngOnInit(): void {
    this.toggle();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.toggle();
  }

  hide() {
    this.collapseController = false;
    const element: HTMLElement = this.htmlEl;

    // // remove collapse show
    element.classList.remove('collapse');
    element.classList.remove('show');

    const height = element.offsetHeight; 
    element.style.height = `${height}px`; 

    element.classList.add('collapsing');
    element.style.height = '';
  }

  show() {
    this.collapseController = true;

    const element: HTMLElement = this.htmlEl;

    element.classList.remove('collapse');
    element.classList.add('collapsing');

    const height = element.scrollHeight;
    element.style.height = `${height}px`;
  }

  toggle() {
    this.collapseController ? this.show() : this.hide();
  }

}
