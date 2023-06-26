import { Component, ContentChild, ContentChildren, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatColumnDef, MatHeaderRowDef, MatNoDataRow, MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { forkJoin, merge, Observable, Subject, Subscription} from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { UserService } from 'src/app/core/user.service';
import * as moment from 'moment';
import { ApiService, QueryResponse } from 'src/app/core/api.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import {FormControl, FormGroup} from "@angular/forms";
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { SelectionModel } from '@angular/cdk/collections';

export interface ColumnConfig {
  reference: string
  displayedName: string
  dataType: string //string, date
  disableFilter?: boolean | null
}

export interface displayModeConfig {
  tooltip: string
  icon: string
}

export class TableConfiguration {
  columnsConfig: ColumnConfig[]
  columns: string[]
  tableKey: string // local storage key for table caching strategy
  emptyTablePlaceholder: string
  placeholderButtonText: string
  saveTableState?: boolean //scroll view to center on last row clicked using URL#ID & add highlight css effect
  showColumnsSelection?: boolean // used to turn on/off the columns selection element
  showAdvancedFilter?: boolean // used to turn on/off advanced filters
  rowSelectable?: boolean // used to turn on/off row selectable
  rowExpandable?: boolean // used to turn on/off row expandable
  rowHoverable?: boolean // used to turn on/off row hover
  nestedTableColumns?: string[] // list of nested table columns
  dataSourceFnName: string // allow table download by calling the api function locally

  constructor(configs) {
    this.columnsConfig = configs.columnsConfig
    this.columns = configs.columns
    this.tableKey = configs.tableKey
    this.emptyTablePlaceholder = configs.emptyTablePlaceholder
    this.placeholderButtonText = configs.placeholderButtonText
    this.rowHoverable =         configs.rowHoverable != undefined        ? configs.rowHoverable        : false
    this.rowExpandable =         configs.rowExpandable != undefined        ? configs.rowExpandable        : false
    this.rowSelectable =         configs.rowSelectable != undefined        ? configs.rowSelectable        : false
    this.showColumnsSelection =  configs.showColumnsSelection != undefined ?           configs.showColumnsSelection : false
    this.showAdvancedFilter =    configs.showAdvancedFilter != undefined   ? configs.showAdvancedFilter   : false
    this.nestedTableColumns =    configs.nestedTableColumns != undefined   ? configs.nestedTableColumns   : []
    this.saveTableState      =   configs.saveTableState     != undefined   ? configs.saveTableState       : true
    this.dataSourceFnName = configs.dataSourceFnName
  }
}

export interface DataRequest {
  pageIdx: number
  pageSize: number
  sort: string
  groupBy: string[]
  params: {[columnName: string]: any}
}

@Component({
  selector: 'table-wrapper',
  templateUrl: './table-wrapper.component.html',
  styleUrls: ['./table-wrapper.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TableWrapperComponent implements OnInit {
    /**
   * Selectable Table:
   * - method()
   *
   * Expandable Table:
   * - expandRow()
   *
   * expandedRow variable
   * configs.rowExpandable
   *
   *
   * Internal Logic
   *
   *
   * onFilterValueChange()
   *    Update activeColumnFilters list
   *    Trigger data refresh
   *
   * onDataRefresh
   *    format sorting if any
   *
   *
   */
  @ContentChildren(MatHeaderRowDef) headerRowDefs: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatHeaderRowDef) filterHeaderDefs: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatRowDef) rowDefs: QueryList<MatRowDef<Object>>;
  @ContentChildren(MatColumnDef) columnDefs: QueryList<MatColumnDef>;
  @ContentChild(MatNoDataRow) noDataRow: MatNoDataRow;
  @ContentChildren('filterInput', {descendants: true}) filterInputs: QueryList<ElementRef>;

  @Input('configs') configs: TableConfiguration; // Component configuration
  @Input('dataRequested') dataRequested: QueryResponse; // Data returned from the server

  public selector = new SelectionModel(
    true,   // multiple selection or not
    [] // initial selected values
  );
  public expandedRow //current expanded row if any

  @Output('onDataRequest') onDataRequest = new EventEmitter(); // Emit event when asking for new data. Pass query params
  @Output('onRowClick') onRowClick = new EventEmitter(); // emit event when a row has been clicked
  @Output('onDisplayModeChange') onDisplayModeChange = new EventEmitter<string>() // emit event when display table mode is changed
  @Output('onPlaceholderButtonClick') onPlaceholderButtonClick = new EventEmitter();

  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatTable, {static: true}) table: MatTable<Object>;

  private refreshDataSub: Subject<void> = new Subject<void>(); // refresh data observer. Used to trigger asking for new data
  // Caching values
  public displayedColumns: string[] = [] // list of columns to display
  public filters = new FormGroup({}) // Advanced Filtering
  public activeSearch = ""

  public activeFilters = [] // stores achive filters to append to the query params to passed during onDataRequest
  public filterColumns: string[] = [] //List of columns to display the filter in (computed form displayed columns)
  public isLoading: boolean = true; // used to display loading animation
  public lastEvt; // stores the params of the last query
  public paginatorConfigs = {
    pageIndex: 0,
    length: 0,
    pageSize: 25,
    pageSizeOptions: [10, 25, 100, 250]
  }
  public dataSource: MatTableDataSource<Object> = new MatTableDataSource([]) // component internal data source to display data
  private tableRowUrlRef: string; // Used to check for #ID in the URL. If found - scroll record into view
  private subscriptions: Subscription[] = []
  public isTableDownloading: boolean = false // used to display loading animation during table download

  public operators = [
    {'name': 'include', 'operator': '~'},
    {'name': 'match', 'operator': ''},
    {'name': 'exclude', 'operator': '!'},
    {'name': 'is empty', 'operator': '!*'},
    {'name': 'is not empty', 'operator': '*'},
  ]

  constructor(
    public user: UserService,
    public sort: MatSort,
    private route: ActivatedRoute,
    private _api: ApiService
  ) { }

  ngOnInit(): void {
    this.ngOnDestroy()// remove all the subscriptions
    this.isLoading  =  true // NG 100 problem fix

    /**
     * Run Table Configuration
     */
    const filtersTypesPerDataType = {
      'string': 'search',
      'date': 'dateRange',
      'number': 'numberRange'
    }

    // add checkbox at the beginning of the table
    if (this.configs.rowSelectable) {
      this.configs.columnsConfig.unshift({reference: 'selector',      displayedName: '',      dataType: '', disableFilter: true})
    }

    // display columns - filter if cache available
    this.displayedColumns = this.configs.columns ? this.configs.columns : this.configs.columnsConfig.map((column: ColumnConfig) => column.reference)
    if (localStorage.getItem(this.configs.tableKey + "-displayed-columns")) {
      this.displayedColumns = this.displayedColumns.filter((column: string) =>  localStorage.getItem(this.configs.tableKey + "-displayed-columns").split(",").includes(column))
    }


    // setup filters - if advanced filtering is active - extract columns references to set in the sub-header as filter columns
    if (this.configs.showAdvancedFilter){
      this.activeFilters = []
      this.filters = new FormGroup({})
      this.configs.columnsConfig.map((columnConfig: ColumnConfig) => {
        this.filters.addControl(columnConfig.reference, new FormGroup({
          columnName: new FormControl(columnConfig.displayedName),
          key: new FormControl(columnConfig.reference),
          value1: new FormControl(null),
          value2: new FormControl(null),
          dataType: new FormControl(columnConfig.dataType),
          operator: new FormControl('~'),
          filterType: new FormControl(filtersTypesPerDataType[columnConfig.dataType]), // to select based on data type
        }))
      })

      this.filters.valueChanges.subscribe(evt => this.onFilterChange())
      this.filterColumns = this.configs.columnsConfig.filter(columnConfig => this.displayedColumns.includes(columnConfig.reference)).map(columnConfig => `filter.${columnConfig.reference}`)
    }

    // restore filters - if cache available
    if (localStorage.getItem(this.configs.tableKey + "-active-filters")) {
      this.filters.patchValue(JSON.parse(localStorage.getItem(this.configs.tableKey + "-active-filters")))
    }

    // // restore active search
    if (localStorage.getItem(this.configs.tableKey + "-search")) {
      this.activeSearch = localStorage.getItem(this.configs.tableKey + '-search')
      setTimeout(() => this.searchInput ? this.searchInput.nativeElement.focus() : null, 500)
    }

    //restore pagination
    if (localStorage.getItem(this.configs.tableKey + "-paginator")) {
      const values = JSON.parse(localStorage.getItem(this.configs.tableKey + "-paginator"))
      this.paginator.pageIndex = values['pageIdx']
      this.paginator.pageSize = values['pageSize']
    }

    // TODO: restoore sorting

    // TODO: REMOVE? use row reference saved in the URL to focus on that specific row
    if (this.configs.saveTableState) {
      this.subscriptions.push(this.route.fragment.subscribe(fragment => this.tableRowUrlRef = fragment))
    }

    const querySub = merge(this.refreshDataSub, this.sort.sortChange, this.paginator.page)
    .pipe(
      map(() => this.isLoading=true),
      debounceTime(500)
    )
    .subscribe(() => {
      // format sorting if any
      const sort = this.sort.direction ? `${this.sort.active}:${this.sort.direction}` : null
      const params = {}

      //dont apply general search if there are other ocolumn filters active
      if (this.activeSearch && this.activeFilters.length == 0) {
        params['search'] = this.activeSearch
      }

      // apply filters if any
      this.activeFilters.map(filter => {
        if (filter.dataType == 'string') {
          params[filter.key] = filter.operator + (filter.value1 || '')
        }

        if (filter.dataType == 'date') {
          params[filter.key] = `${filter.value1 ? moment(filter.value1).format('YYYY-MM-DD') : ''}:${filter.value2 ? moment(filter.value2).add(1, 'days').format('YYYY-MM-DD') : ''}`
        }

        if (filter.dataType == 'number') {
          params[filter.key] = `${filter.value1  ? filter.value1 : ''}:${filter.value2 ? filter.value2 : ''}`
        }
      })

      localStorage.setItem(this.configs.tableKey + "-paginator", JSON.stringify({pageIdx: this.paginator.pageIndex, pageSize: this.paginator.pageSize}))
      this.lastEvt = {pageIdx: this.paginator.pageIndex, pageSize: this.paginator.pageSize, sort: sort, params: params}
      this.onDataRequest.emit(this.lastEvt)
    })
    this.subscriptions.push(querySub)
  }

  ngAfterContentInit() {
    /**
     * Triggered after ngOnInit
     * Used to allow content projection - allows to define table columns outside the component
     */
    this.columnDefs.forEach(columnDef => this.table.addColumnDef(columnDef)); // contains all the columns defined
    this.rowDefs.forEach(rowDef => this.table.addRowDef(rowDef));
    this.headerRowDefs.forEach(headerRowDef => this.table.addHeaderRowDef(headerRowDef));
    this.filterHeaderDefs.forEach(headerRowDef => this.table.addHeaderRowDef(headerRowDef));

    this.table.setNoDataRow(this.noDataRow);
    this.dataSource.sort = this.sort
  }

  ngAfterViewInit() {
    /**
     * Triggered after ngAfterViewInit
     * Here code after the table has been built and all parameters cached refetched and applied
     */



    // trigger data fetching
    this.refreshDataSub.next()

    // TODO: deprecated?
    if (this.configs.saveTableState && this.tableRowUrlRef) {
      setTimeout(() => {
        try {
          const el = document.getElementById(this.tableRowUrlRef)
          el.scrollIntoView();
          el.classList.add('highlight')
        } catch (e) {}
      }, 1000)
    }
  }

  ngOnChanges(changes) {

    if (changes.dataRequested && changes.dataRequested.currentValue) { // if data changed & data changed is available
      this.dataSource.data = changes.dataRequested.currentValue.data
      this.paginatorConfigs.length = changes.dataRequested.currentValue.count
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }

  onSearch(event: Event): void {

    //Clear advanced filters
    this.clearFilters()

    /**
     * Extract searched value and format it in case it is a date
     */
    let searchValue = (event.target as HTMLInputElement).value ? (event.target as HTMLInputElement).value.trim().toLowerCase() : ''


    // format dates if any
    if (moment(searchValue, 'DD/MM/YYYY', true).isValid() &&(searchValue.includes("/") || searchValue.includes("-"))) {
      let parsedD, parsedM, parsedY;
      if (searchValue.includes("/")) {
        [parsedD, parsedM, parsedY] = searchValue.split("/")
      }
      const dd = parsedD.length == 1 ? `0${parsedD}` : parsedD
      const mm = parsedM ? `00${parsedM}`.slice(-2) : null
      const yy = parsedY ? `20${parsedY}`.slice(-4) : null

      let formattedDate = [dd]
      if (mm) {
        formattedDate.unshift(mm)
      }

      if (yy) {
        formattedDate.unshift(yy)
      }

      searchValue = formattedDate.join("-")
    }

    this.activeSearch = searchValue != "" ? searchValue : ""
    localStorage.setItem(this.configs.tableKey + '-search', this.activeSearch)
    this.paginator.firstPage()
    this.refresh()
  }

  refresh() {
    this.refreshDataSub.next()
  }

  _onRowClick(row) {
    if (this.configs.rowSelectable) {
      this.toggleSelection(row)
    }

    this.onRowClick.emit(row)
  }

  onTableDownload() {
    this.isTableDownloading = true
    // get columns info of columns currently displayed
    const columns = this.configs.columnsConfig.filter(record => this.displayedColumns.includes(record.reference))
    const options = { // here csv options: reference here https://www.npmjs.com/package/ngx-csv#options-example
      headers: columns.map(column => column.displayedName)
    }

    const requests = []
    const pageSize = 250
    const idxs = Math.round(this.paginator.length / pageSize)
    for (var pageIdx = 0; pageIdx <= idxs; pageIdx++) {
      requests.push(this._api[this.configs.dataSourceFnName](pageIdx, pageSize, this.lastEvt.sort, this.lastEvt.params, this.lastEvt.groupBy))
    }
    // download all the data matching the query
    // download all the data matching the query & post process it
    forkJoin(requests).subscribe((queryList: any[]) => {
      const csvRowsData = [] // formatted data to save on csv

      // extract data for each record - depending on columns selected
      queryList.map((query) => query.data.map(record => {
        const csvRecord = {}
        columns.map(columnObj => {
          // manage null values & lists
          let value = columnObj.reference.split(".").reduce((record, columnKey) => record ? record[columnKey] : null, record)
          if ((Array.isArray(value) && value.length == 0) || value === null || value == undefined) {
            value = ""
          } else if (columnObj.dataType == "date") { //manage dates
            value = moment(value).format("YYYY-MM-DD HH:mm:ss")
          }
          csvRecord[columnObj.displayedName] = value
        })
        csvRowsData.push(csvRecord)
      }))

      new ngxCsv(csvRowsData, `report_${moment().format('DD-MM-YYYY HH:mm')}`, options);
      this.isTableDownloading = false
    })
  }

  /**
   * Advanced Filters
   */
  onShowColumnChange(isChecked: boolean, column: ColumnConfig){
    if (isChecked) {
      const originalIdx = this.configs.columnsConfig.findIndex((columnConfig: ColumnConfig) => columnConfig.reference == column.reference)
      this.displayedColumns.splice(originalIdx, 0, column.reference)
      this.filterColumns.splice(originalIdx, 0, 'filter.' + column.reference)
    } else {
      this.displayedColumns.splice(this.displayedColumns.indexOf(column.reference), 1)
      this.filterColumns.splice(this.filterColumns.indexOf('filter.' + column.reference), 1)
    }
    localStorage.setItem(this.configs.tableKey + "-displayed-columns", this.displayedColumns.join(","))
    this.clearFilters()
  }

  /**
   * Advanced Filtering
   */

  onOperatorMenuChange(filterForm, operatorObj) {
    const updates = {operator: operatorObj.operator}
    if (operatorObj.operator == "!*") { // if null - remove value from form
      updates['value1'] = null
    }
    filterForm.patchValue(updates)
  }

  onFilterChange() {
    // recalculate filterscc
    this.activeFilters = []
    for (var columnRef in this.filters.controls) {
      const filter = this.filters.controls[columnRef].value
      filter.value1 = filter.value1 == "" ? null : filter.value1 // manage empty strings
      filter.value2 = filter.value2 == "" ? null : filter.value2 // manage empty strings

      // remove operator if value range
      if (filter.dataType == "number" || filter.dataType == "date") {
        filter.operator = ""
      }
      if (filter.value1 != null || filter.value2 != null || filter.operator == "!*" || filter.operator == "*") {
        this.activeFilters.push(filter)
      }
    }

    // cache them
    localStorage.setItem(this.configs.tableKey + "-active-filters", JSON.stringify(this.filters.value))

    // refresh
    this.paginator.firstPage()
    this.refresh()
  }

  onClearFilter(filter) {
    // find control - clear filter
    for (var controlKey in this.filters.controls) {
      if (this.filters.controls[controlKey].value.key == filter.key) {
        this.filters.controls[controlKey].patchValue({value1: null, value2: null, operator: "~"})
      }
    }
    // trigger onFilterChage
    this.onFilterChange()
  }

  //Clear avanced filter
  clearFilters(){
    for (var controlKey in this.filters.controls) {
      this.filters.controls[controlKey].patchValue({value1: null, value2: null, operator: "~"})
    }
    this.onFilterChange()
  }

  /**
   * Selectable Rows Table
   */

  isSelected(row): boolean {
    //Used to check if element is selected
    const match = this.selector.selected.find(record => record.ID == row.ID)
    return match != undefined
  }

  toggleSelection(row) {
    if (this.isSelected(row)) {
      // deselect using ID since memory object may have changed
      // clear selector and refill it because simply splice() doesn't work on selector for some reason
      const idx = this.selector.selected.findIndex(selected => selected.ID == row.ID)
      this.selector.selected.splice(idx, 1) // remove deselected record
      const _c = [...this.selector.selected] // create new copy in memory of selected objects
      this.selector.clear() // clear and re-populate
      _c.forEach(record => this.selector.select(record))
    } else {
      this.selector.select(row)
    }
  }

  /**
   * Expandable Table
   */

  toggleRowExpand(row): void {
    this.expandedRow = this.expandedRow === row ? null : row
  }

  isRowExpanded(row): boolean {
    return this.expandedRow === row
  }

  switchTableMode(){
    //console.log(this.configs)
  }
}
