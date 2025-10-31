import { ref } from 'vue'
import {
  getUserLoan,
  getRWAPrice,
  calculateHealthRatio,
  lockAndBorrow as contractLockAndBorrow,
  repayLoan as contractRepayLoan,
  liquidateLoan as contractLiquidateLoan
} from '@/services/contracts'

export type LoanStatus = 'active' | 'completed' | 'liquidated'

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
  status: LoanStatus
  userAddress?: string
  healthRatio?: number
}

const loans = ref<Loan[]>([])
const isLoading = ref(false)

export function useLoans() {
  /**
   * 從區塊鏈載入用戶的貸款數據
   */
  const loadUserLoan = async (userAddress: string) => {
    try {
      isLoading.value = true
      const loanData = await getUserLoan(userAddress)
      const rwaPrice = await getRWAPrice()
      
      // 只有當用戶有借款時才處理
      if (parseFloat(loanData.debtAmount) > 0) {
        const collateralAmountNum = parseFloat(loanData.collateralAmount)
        const debtAmountNum = parseFloat(loanData.debtAmount)
        const rwaPriceNum = parseFloat(rwaPrice)
        
        const collateralValue = collateralAmountNum * rwaPriceNum
        const liquidationPrice = (debtAmountNum / collateralAmountNum) / 0.8 // 80% 清算門檻
        const healthRatio = await calculateHealthRatio(userAddress)
        
        // 檢查是否已經存在這筆貸款
        const existingLoanIndex = loans.value.findIndex(l => l.userAddress === userAddress)
        
        const loanStatus: LoanStatus = healthRatio < 80 ? 'liquidated' : 'active'
        
        const loan: Loan = {
          id: userAddress, // 使用用戶地址作為唯一 ID
          merchantName: 'On-chain Loan',
          merchant: userAddress,
          collateralAsset: 'tTSLA',
          collateralAmount: `${collateralAmountNum.toFixed(4)} tTSLA`,
          collateralValue: collateralValue,
          currentValue: collateralValue,
          borrowedAmount: debtAmountNum,
          borrowedCurrency: 'mUSDC',
          liquidationPrice: liquidationPrice,
          timestamp: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: loanStatus,
          userAddress: userAddress,
          healthRatio: healthRatio
        }
        
        if (existingLoanIndex >= 0) {
          loans.value[existingLoanIndex] = loan
        } else {
          loans.value.push(loan)
        }
      } else {
        // 如果沒有債務，移除該用戶的貸款記錄
        loans.value = loans.value.filter(l => l.userAddress !== userAddress)
      }
    } catch (error) {
      console.error('Failed to load user loan:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 添加新的貸款（用於本地顯示）
   */
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

  /**
   * 執行抵押借款
   */
  const executeLockAndBorrow = async (
    rwaAmount: string,
    usdcAmount: string,
    userAddress: string,
    merchantName?: string
  ) => {
    try {
      isLoading.value = true
      
      // 強制轉換為字符串並記錄
      const rwaAmountStr = String(rwaAmount)
      const usdcAmountStr = String(usdcAmount)
      
      console.log('🎯 useLoans.executeLockAndBorrow 收到參數:')
      console.log('  rwaAmount:', rwaAmount, '| Type:', typeof rwaAmount)
      console.log('  usdcAmount:', usdcAmount, '| Type:', typeof usdcAmount)
      console.log('  轉換後 rwaAmountStr:', rwaAmountStr, '| Type:', typeof rwaAmountStr)
      console.log('  轉換後 usdcAmountStr:', usdcAmountStr, '| Type:', typeof usdcAmountStr)
      
      await contractLockAndBorrow(rwaAmountStr, usdcAmountStr)
      
      // 重新載入貸款數據
      await loadUserLoan(userAddress)
      
      return true
    } catch (error) {
      console.error('Failed to lock and borrow:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 執行還款
   */
  const executeRepay = async (repayAmount: string, userAddress: string) => {
    try {
      isLoading.value = true
      await contractRepayLoan(repayAmount)
      
      // 重新載入貸款數據
      await loadUserLoan(userAddress)
      
      return true
    } catch (error) {
      console.error('Failed to repay loan:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 完成貸款（本地狀態更新）
   */
  const completeLoan = (id: string) => {
    loans.value = loans.value.map((loan) =>
      loan.id === id ? { ...loan, status: 'completed' as const } : loan
    )
  }

  /**
   * 執行清算
   */
  const executeLiquidate = async (targetUserAddress: string, currentUserAddress: string) => {
    try {
      isLoading.value = true
      await contractLiquidateLoan(targetUserAddress)
      
      // 重新載入兩個用戶的貸款數據
      await loadUserLoan(targetUserAddress)
      await loadUserLoan(currentUserAddress)
      
      return true
    } catch (error) {
      console.error('Failed to liquidate loan:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清算貸款（本地狀態更新）
   */
  const liquidateLoan = (id: string) => {
    loans.value = loans.value.map((loan) =>
      loan.id === id ? { ...loan, status: 'liquidated' as const } : loan
    )
  }

  /**
   * 更新貸款的健康度和當前價值
   */
  const updateLoanMetrics = async (userAddress: string) => {
    const loan = loans.value.find(l => l.userAddress === userAddress)
    if (!loan) return

    try {
      const rwaPrice = await getRWAPrice()
      const healthRatio = await calculateHealthRatio(userAddress)
      const collateralAmountNum = parseFloat(loan.collateralAmount)
      const rwaPriceNum = parseFloat(rwaPrice)
      
      const loanIndex = loans.value.findIndex(l => l.userAddress === userAddress)
      if (loanIndex >= 0) {
        loans.value[loanIndex] = {
          ...loan,
          currentValue: collateralAmountNum * rwaPriceNum,
          healthRatio: healthRatio,
          status: healthRatio < 80 ? 'liquidated' : loan.status
        }
      }
    } catch (error) {
      console.error('Failed to update loan metrics:', error)
    }
  }

  return {
    loans,
    isLoading,
    addLoan,
    loadUserLoan,
    executeLockAndBorrow,
    executeRepay,
    completeLoan,
    executeLiquidate,
    liquidateLoan,
    updateLoanMetrics
  }
}
