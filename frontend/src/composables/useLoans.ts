import { ref } from 'vue'

export type LoanStatus = 'active' | 'completed'

export interface Loan {
  id: string
  merchantName: string
  merchant: string
  collateralAsset: string
  collateralAmount: string
  collateralValue: number
  currentValue: number
  borrowedAmount: number
  borrowedCurrency: string
  liquidationPrice: number
  timestamp: string
  status: 'active' | 'completed' | 'liquidated'
}

const loans = ref<Loan[]>([
  {
    id: '1',
    merchantName: 'Starbucks',
    collateralAsset: 'Ethereum',
    collateralAmount: '1.5 ETH',
    collateralValue: 5671.95,
    borrowedAmount: 500,
    borrowedCurrency: 'USDT',
    currentValue: 5850,
    status: 'active',
    merchant: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    timestamp: '2025-10-30 14:30',
    liquidationPrice: 625, // 500 / 0.8 = 625
  },
  {
    id: '2',
    merchantName: 'Apple Store',
    collateralAsset: 'USDC',
    collateralAmount: '2000 USDC',
    collateralValue: 2000,
    borrowedAmount: 1500,
    borrowedCurrency: 'USDT',
    currentValue: 2000,
    status: 'active',
    merchant: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    timestamp: '2025-10-29 10:15',
    liquidationPrice: 1875, // 1500 / 0.8 = 1875
  },
  {
    id: '3',
    merchantName: 'Amazon',
    collateralAsset: 'Ethereum',
    collateralAmount: '0.8 ETH',
    collateralValue: 3024.64,
    borrowedAmount: 300,
    borrowedCurrency: 'USDT',
    currentValue: 2950,
    status: 'completed',
    merchant: '0x1234567890abcdef1234567890abcdef12345678',
    timestamp: '2025-10-28 18:45',
    liquidationPrice: 375, // 300 / 0.8 = 375
  },
])

export function useLoans() {
  const addLoan = (loanData: Omit<Loan, 'id' | 'timestamp'>) => {
    const newLoan: Loan = {
      ...loanData,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    loans.value = [newLoan, ...loans.value]
  }

  const completeLoan = (id: string) => {
    loans.value = loans.value.map((loan) =>
      loan.id === id ? { ...loan, status: 'completed' as const } : loan
    )
  }

  const liquidateLoan = (id: string) => {
    loans.value = loans.value.map((loan) =>
      loan.id === id ? { ...loan, status: 'liquidated' as const } : loan
    )
  }

  return {
    loans,
    addLoan,
    completeLoan,
    liquidateLoan,
  }
}
