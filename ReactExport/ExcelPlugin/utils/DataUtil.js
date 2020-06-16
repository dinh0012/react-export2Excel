import XLSX from "tempa-xlsx";
import {getDescendantProp} from "../../../../../Utils/Function/CommonFunctions";

const strToArrBuffer = (s) => {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);

    for (var i = 0; i != s.length; ++i) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }

    return buf;
};

const dateToNumber = (v, date1904) => {
    if (date1904) {
        v += 1462;
    }

    var epoch = Date.parse(v);

    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
};

const excelSheetFromDataSet = (dataSet) => {
    /*
    Assuming the structure of dataset
    {
        xSteps?: number; //How many cells to skips from left
        ySteps?: number; //How many rows to skips from last data
        columns: [array | string]
        data: [array_of_array | string|boolean|number | CellObject]
        fill, font, numFmt, alignment, and border
    }
     */
    if (dataSet === undefined || dataSet.length === 0) {
        return {};
    }

    var ws = {};
    var range = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};
    var rowCount = 0;
    dataSet.forEach(dataSetItem => {
        var columns = dataSetItem.columns;

        const merge = dataSetItem.merge || []
        var xSteps = typeof(dataSetItem.xSteps) === 'number' ? dataSetItem.xSteps : 0;
        var ySteps = typeof(dataSetItem.ySteps) === 'number' ? dataSetItem.ySteps : 0;
        var data = dataSetItem.data;
        if (dataSet === undefined || dataSet.length === 0) {
            return;
        }
        rowCount += ySteps;
        var columnsWidth = []
        let rowIndex = renderHeader({columns, columnsWidth, xSteps, ySteps, range, rowCount, ws, merge});
        if (columnsWidth.length > 0){
            ws['!cols'] = columnsWidth;
        }
        renderData({rowIndex, xSteps, ySteps, range, data, ws, columns, rowCount})

        ws["!merges"] = merge;

    });
    if (range.s.c < 10000000) {
        ws['!ref'] = XLSX.utils.encode_range(range);
    }
    return ws;
};

const renderData = ({rowIndex, xSteps, ySteps, range, data, ws, columns}) => {
    for (var R = 0; R != data.length; ++R, ++rowIndex) {
        let colIndex = 0;
        columns.forEach((col, C) => {
            const children = col.children && col.children.length ? col.children : null
            if (children ) {
                children.map((item, index) => {
                    colIndex += index
                    fillData({colIndex, xSteps, ySteps, rowIndex, col: item, range, data, R, ws})
                })
            } else {
                fillData({colIndex, xSteps, ySteps, rowIndex, col, range, data, R, ws})
            }
            colIndex++;
        })
    }
}

const fillData = ({colIndex, xSteps, ySteps, rowIndex, col, range, data, R, ws}) => {
    const {dataIndex, renderExport} = col
    const cellRef = XLSX.utils.encode_cell({c: colIndex + xSteps, r: rowIndex});
    fixRange(range, R, colIndex, rowIndex, xSteps, ySteps);
    const value = getDescendantProp(data[R], dataIndex)
    let valueFormat = value
    if (renderExport) {
        valueFormat = renderExport(value)
    }
    if (typeof value === 'number') {
        valueFormat = {value: valueFormat}
        valueFormat.style = {numFmt: "#,##0_);(#,##0)"}
    }
    getCell(valueFormat, cellRef, ws);
}

const renderHeader = ({columns, columnsWidth, xSteps, ySteps, range, rowCount, ws, merge}) => {
    let colIndex = 0
    let rowIndex = 0
    const hasChildren = columns.find((col) => col.children && col.children.length)
    columns.forEach((col) => {
        const children = col.children && col.children.length ? col.children : null
        hasChildren && !children  && merge.push({ s: { r: 0, c: colIndex }, e: { r: 1, c: colIndex } });
        const cellRef = XLSX.utils.encode_cell({c: xSteps + colIndex, r: rowCount});
        fixRange(range, rowIndex, colIndex, rowCount , xSteps, ySteps);
        getHeaderCell(col, cellRef, ws);
        if (children) {
            merge.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + children.length - 1 } });
            children.map((subColumns, index) => {
                colIndex += index;
                const cellRef = XLSX.utils.encode_cell({c: xSteps + colIndex, r: rowCount + 1});
                if (typeof subColumns === 'object' && typeof subColumns.width === 'object') {
                    columnsWidth.push(subColumns.width || {wpx: 80});
                } else {
                    columnsWidth.push({wpx: subColumns.width || 80})
                }
                getHeaderCell(subColumns, cellRef, ws);
            })
            rowIndex = 1
        }

        if (typeof col === 'object' && typeof col.width === 'object') {
            columnsWidth.push(col.width || {wpx: 80});
        } else {
            columnsWidth.push({wpx: col.width || 80})
        }
        colIndex++
    });
    rowIndex += 1;
    return rowIndex
}

function getHeaderCell(v, cellRef, ws) {
    const cell = {};
    const headerCellStyle = v.style ? v.style : {
        font: { bold: true, },
        alignment: {horizontal:  "center", vertical:  "center"},
        border: {
            bottom: {style: "thin"},
            left: {style: "thin"},
            right: {style: "thin"},
            top: {style: "thin"},
        }
    }; //if style is then use it
    cell.v = v.title;
    cell.t = 's';
    cell.s = headerCellStyle;
    ws[cellRef] = cell;
}

function getCell(v, cellRef, ws) {
    //assume v is indeed the value. for other cases (object, date...) it will be overriden.
    var cell = {v};
    if (v === null) {
        v = {value: ''}
    }
    const {style = {}} = v

    var isDate = (v instanceof Date);
    if (!isDate && (typeof v === 'object')) {

        cell.v = v.value;
        v = v.value;
    }
    cell.s = {
        ...style,
        border: {
            bottom: {style: "thin"},
            left: {style: "thin"},
            right: {style: "thin"},
            top: {style: "thin"},
        }
    };
    if (typeof v === 'number') {
        cell.t = 'n';
    } else if (typeof v === 'boolean') {
        cell.t = 'b';
    } else if (isDate) {
        cell.t = 'n';
        cell.z = XLSX.SSF._table[14];
        cell.v = dateToNumber(cell.v);
    } else {
        cell.t = 's';
    }
    ws[cellRef] = cell;
}

function fixRange(range, R, C, rowCount, xSteps, ySteps) {
    if (range.s.r > R + rowCount) {
        range.s.r = R + rowCount;
    }


    if (range.e.r < R + rowCount) {
        range.e.r = R + rowCount;
    }

    if (range.s.c > C + xSteps) {
        range.s.c = C + xSteps;
    }

    if (range.e.c < C + xSteps) {
        range.e.c = C + xSteps;
    }
}

const excelSheetFromAoA = (data) => {
    var ws = {};
    var range = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};

    for (var R = 0; R != data.length; ++R) {
        for (var C = 0; C != data[R].length; ++C) {
            if (range.s.r > R) {
                range.s.r = R;
            }

            if (range.s.c > C) {
                range.s.c = C;
            }

            if (range.e.r < R) {
                range.e.r = R;
            }

            if (range.e.c < C) {
                range.e.c = C;
            }

            var cell = {v: data[R][C]};
            if (cell.v === null) {
                continue;
            }

            var cellRef = XLSX.utils.encode_cell({c: C, r: R});
            if (typeof cell.v === 'number') {
                cell.t = 'n';
            } else if (typeof cell.v === 'boolean') {
                cell.t = 'b';
            } else if (cell.v instanceof Date) {
                cell.t = 'n';
                cell.z = XLSX.SSF._table[14];
                cell.v = dateToNumber(cell.v);
            } else {
                cell.t = 's';
            }

            ws[cellRef] = cell;
        }
    }

    if (range.s.c < 10000000) {
        ws['!ref'] = XLSX.utils.encode_range(range);
    }

    return ws;
};


export {strToArrBuffer, dateToNumber, excelSheetFromAoA, excelSheetFromDataSet};
