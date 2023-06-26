import { Component, HostListener, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-terms-and-conditions',
  templateUrl: './terms-and-conditions.component.html',
  styleUrls: ['./terms-and-conditions.component.css']
})
export class TermsAndConditionsComponent implements OnInit {
  public userRead = false
  onScroll(event) {
    if (event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight) {
      this.userRead = true
    }
  }
  constructor(
    private dialogRef: MatDialogRef<TermsAndConditionsComponent>,
  ) { }

  ngOnInit(): void {
  }

  onConfirm() {
    this.dialogRef.close(true);
  }

}
