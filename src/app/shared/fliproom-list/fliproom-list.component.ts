import { Component, ContentChild, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { Subject, merge } from 'rxjs';
import { map, debounceTime, take } from 'rxjs/operators';
import { QueryResponse } from 'src/app/core/api.service';

@Component({
  selector: 'fliproom-list',
  templateUrl: './fliproom-list.component.html',
  styleUrls: ['./fliproom-list.component.scss'],
})
export class FliproomListComponent implements OnInit {
  @Input('dataRequested') dataRequested: QueryResponse; // Data returned from the server
  @Input('emptyListPlaceholder') emptyListPlaceholder: string
  @Input('placeholderButtonText') placeholderButtonText: string
  @Input('prefilledSearchText') prefilledSearchText: string
  @ContentChild('itemList') itemListTmpl: TemplateRef<any>;

  @Output('onDataRequest') onDataRequest = new EventEmitter(); // Emit event when asking for new data. Pass query params
  @Output('onRowClick') onRowClick = new EventEmitter(); // emit event when a row has been clicked
  @Output('onPlaceholderButtonClick') onPlaceholderButtonClick = new EventEmitter();

  public dataSource: {data: Object[], count: number} = {
    data: [],
    count: 0
  }
  public isLoading: boolean = true
  public lastEvt; // stores the params of the last query

  private refreshDataSub: Subject<void> = new Subject<void>(); // refresh data observer. Used to trigger asking for new data
  private dataLoaded: Subject<Object[]> = new Subject<Object[]>(); // used to onotify once the data has been updated
  private pageIdx: number = 0;
  private pageSize: number = 50;

  public activeSearch: string;

  constructor() { }

  ngOnInit() {
    this.isLoading = true

    this.prefilledSearchText ? this.activeSearch = this.prefilledSearchText : null;

    const querySub = merge(this.refreshDataSub)
    .pipe(
      map(() => {
        if (this.dataSource.data.length == 0) { // don;t reinstantiate list if scrolling (data already in the list)
          this.isLoading=true
        }
      }),
      debounceTime(500)
    )
    .subscribe(() => {
      let params = {}
      if (this.activeSearch) {
        params['search'] = this.activeSearch
      }

      this.lastEvt = {pageIdx: this.pageIdx, pageSize: this.pageSize, sort: null, params: params}
      this.onDataRequest.emit(this.lastEvt)
    })
  }

  ngOnChanges(changes) {
    if (changes.dataRequested && changes.dataRequested.currentValue) { // if data changed & data changed is available
      this.dataSource.data = changes.dataRequested.currentValue.data
      this.dataSource.count = changes.dataRequested.currentValue.count
      this.isLoading = false;
      this.dataLoaded.next(this.dataSource.data)
    }
  }

  ngAfterViewInit() {
    /**
     * Triggered after ngAfterViewInit
     * Here code after the table has been built and all parameters cached refetched and applied
     */

    // trigger data fetching
    this.refreshDataSub.next()
  }

  refresh() {
    this.isLoading = true // force loading animation
    this.pageIdx = 0;
    this.refreshDataSub.next()
  }

  onScrollRefresh(evt) {
    this.refresh()
    this.dataLoaded.subscribe((data: Object[]) => evt.target.complete())
  }

  onSearch(evt) {
    let searchValue = (evt.target as HTMLInputElement).value ? (evt.target as HTMLInputElement).value.trim().toLowerCase() : ''
    this.activeSearch = searchValue
    this.refresh()
  }

  onRowClicked(row) {
    this.onRowClick.emit(row)
  }

  onLoadMoreData(evt) {
    this.pageIdx += 1
    this.refreshDataSub.next()

    let bufferData = this.dataSource.data

    this.dataLoaded.pipe(
      take(1)
    ).subscribe((data: Object[]) => {
      bufferData = bufferData.concat(data)
      this.dataSource.data = bufferData
      evt.target.complete()
      if(this.dataSource.data.length == this.dataSource.count) {
        evt.target.disabled = true
      } else {
        evt.target.disabled = false
      }
    })
  }

}
