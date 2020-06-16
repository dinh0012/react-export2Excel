import React from 'react'

const Example = (props) => {
  const columns = [
    {
      title: i18n.t('dateOfExpense'),
      dataIndex: 'expenseDate',
      width: 150,
      align: 'center',
    },
    {
      title: i18n.t('expenditureGroup'),
      dataIndex: 'expenseCategory.expenseGroup.name',
      width: 150,
      align: 'center',
    },
    {
      title: i18n.t('itemExpenditure'),
      dataIndex: 'expenseCategory.name',
      width: 150,
      align: 'center',
    },
    {
      title: i18n.t('personExpenditure'),
      dataIndex: 'spender.firstName',
      width: 150,
      align: 'center',
    },
    {
      title: i18n.t('amount'),
      dataIndex: 'amount',
      width: 150,
      align: 'right',

    },
    {
      title: i18n.t('expenseMethod'),
      dataIndex: 'paymentMethod',
      width: 150,
      align: 'right',
      renderExport: (text) => CONFIG.PAYMENT_METHODS.find(item => +item.key === text).label,

    },
    {
      title: i18n.t('note'),
      dataIndex: 'note',
      width: 150,
      align: 'center',
    },
  ]

  const data = [
    {
      accessor1: "value",
      accessor2: value,
    }
  ]
  return (
    <ExportToExcel columns={columns}
      dataSource={dataSource}
      filename={`example`}
    />
  )
}

export default Example
