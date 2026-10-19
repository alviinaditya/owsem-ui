import type { ReactNode } from "react";

interface MatrixRow {
  label: string;
  /** One per column, in the same order. */
  cells: readonly ReactNode[];
}

/**
 * A comparison for the stage (DS-2's states and variants): named columns by named rows, each
 * cell a live demo. Give a scene `demo` that returns one.
 */
export function Matrix({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: readonly MatrixRow[];
}) {
  return (
    <table className="lab-matrix">
      <thead>
        <tr>
          <td />
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
            {row.cells.map((cell, i) => (
              <td key={`${row.label}:${columns[i]}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
