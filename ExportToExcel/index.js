import React from 'react';
import ReactExport from '../ReactExport';
import Button from "../Button";
import {useTranslation} from "react-i18next";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelSheet;


const ExportToExcel = ({columns = [], dataSource = [], filename, excelSheets}) => {
    const multiDataSet = [
        {
            columns: columns,
            data: dataSource
        }
    ];
    const {t} = useTranslation()
    return (
        <ExcelFile element={<Button icon="download">{t('Export')}</Button>} filename={filename}>
            {excelSheets && excelSheets.length && excelSheets.map((sheet, index) => {
                const {columns, dataSource, sheetName} = sheet
                const multiDataSet = [
                    {
                        columns: columns,
                        data: dataSource
                    }
                ];
                return <ExcelSheet dataSet={multiDataSet} name={sheetName} key={index}/>
            })}
            {!excelSheets && <ExcelSheet dataSet={multiDataSet} name="sheet1"/>}
        </ExcelFile>
    )

}
export default ExportToExcel
