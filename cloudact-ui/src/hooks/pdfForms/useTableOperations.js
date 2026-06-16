import { useState, useCallback } from 'react';

export const useTableOperations = () => {
  const [tables, setTables] = useState([]);

  const createTable = useCallback((tableData) => {
    // Detect column types from the first row of data
    const columnTypes = tableData.headers.reduce((types, header) => {
      const firstValue = tableData.rows[0]?.[tableData.headers.indexOf(header)];
      let type = 'string';

      if (!isNaN(Date.parse(firstValue))) {
        type = 'date';
      } else if (!isNaN(firstValue) && typeof firstValue !== 'boolean') {
        type = 'number';
      } else if (typeof firstValue === 'boolean' || firstValue === 'true' || firstValue === 'false') {
        type = 'boolean';
      }

      return { ...types, [header]: type };
    }, {});

    // Calculate dimensions
    const columnWidths = tableData.headers.map(header => {
      const headerLength = header.length;
      const maxContentLength = Math.max(
        headerLength,
        ...tableData.rows.map(row =>
          String(row[tableData.headers.indexOf(header)] || '').length
        )
      );
      return Math.min(Math.max(maxContentLength * 8, 60), 200);
    });

    const calculatedWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const baseRowHeight = 25;
    const rowHeights = [baseRowHeight];
    
    tableData.rows.forEach(row => {
      const maxLines = Math.max(...row.map(cell =>
        Math.ceil(String(cell).length * 8 / (calculatedWidth / row.length))
      ));
      rowHeights.push(Math.max(baseRowHeight, maxLines * 20));
    });

    const newTable = {
      id: Date.now(),
      type: "Table",
      x: 50,
      y: 200,
      width: calculatedWidth,
      height: rowHeights.reduce((sum, height) => sum + height, 0),
      data: [tableData.headers, ...tableData.rows],
      styles: {
        columnWidths,
        rowHeights,
        headerStyle: {
          backgroundColor: '#f3f4f6',
          fontWeight: 'bold',
          fontSize: 11
        },
        cellStyle: {
          fontSize: 10,
          padding: 4,
          borderColor: '#e5e7eb'
        },
        columnTypes
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };

    setTables(prev => [...prev, newTable]);
    return newTable;
  }, []);

  const updateTableCell = useCallback((tableId, rowIndex, columnIndex, value) => {
    setTables(prev => prev.map(table => {
      if (table.id === tableId) {
        const newData = [...table.data];
        newData[rowIndex + 1][columnIndex] = value;
        return {
          ...table,
          data: newData,
          metadata: {
            ...table.metadata,
            lastModified: new Date().toISOString()
          }
        };
      }
      return table;
    }));
  }, []);

  const sortTable = useCallback((tableId, columnIndex, direction = 'asc') => {
    setTables(prev => prev.map(table => {
      if (table.id === tableId) {
        const headers = table.data[0];
        const rows = table.data.slice(1);
        const columnType = table.styles.columnTypes[headers[columnIndex]];

        const sortedRows = rows.sort((a, b) => {
          const aVal = a[columnIndex];
          const bVal = b[columnIndex];

          switch (columnType) {
            case 'date':
              return direction === 'asc' ? 
                new Date(aVal) - new Date(bVal) :
                new Date(bVal) - new Date(aVal);
            case 'number':
              return direction === 'asc' ?
                Number(aVal) - Number(bVal) :
                Number(bVal) - Number(aVal);
            default:
              return direction === 'asc' ?
                String(aVal).localeCompare(String(bVal)) :
                String(bVal).localeCompare(String(aVal));
          }
        });

        return {
          ...table,
          data: [headers, ...sortedRows],
          metadata: {
            ...table.metadata,
            lastModified: new Date().toISOString()
          }
        };
      }
      return table;
    }));
  }, []);

  return {
    tables,
    createTable,
    updateTableCell,
    sortTable,
    setTables
  };
};