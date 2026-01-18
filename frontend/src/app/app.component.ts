import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ResearchService } from './research.service';
import { ResearchItem } from './models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  searchControl = new FormControl('');
  // Default query shown on initial load
  defaultQuery = 'machine learning';
  // Track the current query for UI feedback
  currentQuery = '';

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

    // Run an initial search with a sensible default so the page is not empty
    this.doSearch(this.defaultQuery);
  }

  doSearch(q: string) {
    this.loading = true;
    this.currentQuery = q;
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

  private getCurrentPageData(): ResearchItem[] {
    let data = this.dataSource.filteredData.slice();
    if (this.dataSource.sort) {
      data = this.dataSource.sortData(data, this.dataSource.sort);
    }
    if (this.paginator) {
      const start = this.paginator.pageIndex * this.paginator.pageSize;
      const end = start + this.paginator.pageSize;
      return data.slice(start, end);
    }
    return data;
  }

  exportCsv() {
    const rows = this.getCurrentPageData();
    const header = ['Title', 'Authors', 'Journal', 'Year', 'DOI'];
    const csvRows = [header, ...rows.map((r) => [r.title, r.authors.join(', '), r.journal, r.year, r.doi])];
    const csv = csvRows
      .map((r) => r.map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'research-page.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    const rows = this.getCurrentPageData();
    const doc = new jsPDF({ orientation: 'landscape' });
    autoTable(doc, {
      head: [['Title', 'Authors', 'Journal', 'Year', 'DOI']],
      body: rows.map((r) => [r.title, r.authors.join(', '), r.journal, r.year, r.doi]),
      styles: { fontSize: 8, cellWidth: 'wrap' },
      headStyles: { fillColor: [63, 81, 181], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 70 },
        2: { cellWidth: 60 },
        3: { cellWidth: 20 },
        4: { cellWidth: 50 },
      },
      margin: { top: 14, left: 10, right: 10 },
    });
    doc.save('research-page.pdf');
  }
}