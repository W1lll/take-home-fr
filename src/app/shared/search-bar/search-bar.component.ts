import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'fliproom-searchbar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit {
  @Input('value') _value;
  @Output('onSearch') onSearch = new EventEmitter(); // emit event when a row has been clicked

  @ViewChild('searchInput') searchInput: ElementRef

  public inputValue: string;

  //debounce
  constructor() { }

  ngOnInit() {
    this.inputValue = this._value || ''

    setTimeout(() => {
      this.searchInput.nativeElement.focus()
    }, 400)
  }

  onKeystroke(evt) {
    this.onSearch.emit(evt)
  }

}
