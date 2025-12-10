import React from 'react';
import clsx from 'clsx';
import { TableComponent } from '@re/core';

export function Table({ props }: { props: TableComponent['props'] }) {
  const { headers, rows, striped } = props;

  return (
    <div className="re-table-container">
      <table className={clsx('re-table', striped && 're-table-striped')}>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {headers.map((header, colIdx) => (
                <td key={colIdx}>{row[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
