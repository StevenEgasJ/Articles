import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ResearchService } from './research.service';
import { ResearchItem } from './models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  searchControl = new FormControl('');
  displayedColumns = ['title', 'authors', 'journal', 'year', 'doi'];
  dataSource = new MatTableDataSource<ResearchItem>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private research: ResearchService) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.searchControl.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe((v) => {
      if (v && v.length > 1) this.doSearch(v);
    });
  }

  doSearch(q: string) {
    this.loading = true;
    this.research.search(q, 25).subscribe({
      next: (res) => {
        this.dataSource.data = res.results;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  openDoi(doi: string) {
    window.open(`https://doi.org/${doi}`, '_blank');
  }
}