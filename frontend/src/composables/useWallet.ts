import { ref, onMounted, onUnmounted } from 'vue'
import {
  connectWallet,
  getETHBalance,
  getUSDCBalance,
  getRWABalance,
  getRWAPrice,
  clearCache,
  onAccountsChanged,
  onChainChanged,
  removeAllListeners,
  isWhitelisted,
  addToWhitelist,
  addMeToWhitelist
} from '@/services/contracts'

export interface Asset {
  symbol: string
  name: string
  balance: number
  price: number
  usdValue: number
}

const address = ref<string | null>(null)
const assets = ref<Asset[]>([])
const isLoading = ref(false)
const isInWhitelist = ref(false)

export function useWallet() {
  const connect = async (forceSelect = false) => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        isLoading.value = true
        const connectedAddress = await connectWallet(forceSelect)
        address.value = connectedAddress

        // 載入資產餘額
        await loadAssets(connectedAddress)
        
        // 檢查白名單狀態
        await checkWhitelistStatus(connectedAddress)
      } catch (error) {
        console.error('Failed to connect wallet:', error)
        alert('連接錢包失敗: ' + (error as Error).message)
      } finally {
        isLoading.value = false
      }
    } else {
      alert('請安裝 MetaMask 或其他 Web3 錢包')
    }
  }

  const switchAccount = async () => {
    // 切換帳戶時強制顯示選擇器
    await connect(true)
  }

  const disconnect = () => {
    address.value = null
    assets.value = []
    isInWhitelist.value = false
    clearCache()
    if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
      console.log('Wallet disconnected. Reconnecting will prompt for account selection.')
    }
  }

  const loadAssets = async (userAddress: string) => {
    try {
      console.log('💰 開始載入資產，地址:', userAddress)
      
      // 並行獲取所有餘額
      const [ethBalance, usdcBalance, rwaBalance, rwaPrice] = await Promise.all([
        getETHBalance(userAddress),
        getUSDCBalance(userAddress),
        getRWABalance(userAddress),
        getRWAPrice()
      ])

      console.log('📊 資產餘額:')
      console.log('  ETH:', ethBalance)
      console.log('  mUSDC:', usdcBalance)
      console.log('  tTSLA:', rwaBalance)
      console.log('  tTSLA Price:', rwaPrice)

      const ethPrice = 3781.3 // 可以從其他 API 獲取實時 ETH 價格
      const usdcPrice = 1.0
      const rwaPriceNum = parseFloat(rwaPrice)

      assets.value = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: parseFloat(ethBalance),
          price: ethPrice,
          usdValue: parseFloat(ethBalance) * ethPrice
        },
        {
          symbol: 'mUSDC',
          name: 'Mock USD Coin',
          balance: parseFloat(usdcBalance),
          price: usdcPrice,
          usdValue: parseFloat(usdcBalance) * usdcPrice
        },
        {
          symbol: 'tTSLA',
          name: 'Tokenized Tesla Stock',
          balance: parseFloat(rwaBalance),
          price: rwaPriceNum,
          usdValue: parseFloat(rwaBalance) * rwaPriceNum
        }
      ]
      
      console.log('✅ 資產載入完成:', assets.value)
    } catch (error) {
      console.error('❌ 載入資產失敗:', error)
    }
  }

  const checkWhitelistStatus = async (userAddress: string) => {
    console.log('🔍 開始檢查白名單，地址:', userAddress)
    
    // Hardhat 測試帳戶直接認為在白名單中
    const HARDHAT_ACCOUNTS = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' // 小寫版本
    ]
    
    const isHardhatAccount = HARDHAT_ACCOUNTS.some(
      acc => acc.toLowerCase() === userAddress.toLowerCase()
    )
    
    if (isHardhatAccount) {
      console.log('✅ Hardhat Account 0 檢測到 - 強制設為白名單')
      isInWhitelist.value = true
      console.log('✅ isInWhitelist 已設為:', isInWhitelist.value)
      return
    }
    
    try {
      console.log('🔍 查詢合約白名單狀態...')
      const whitelisted = await isWhitelisted(userAddress)
      console.log('✅ 合約返回:', whitelisted)
      isInWhitelist.value = Boolean(whitelisted)
      console.log('✅ isInWhitelist 設為:', isInWhitelist.value)
    } catch (error) {
      console.error('❌ 白名單檢查失敗:', error)
      isInWhitelist.value = false
    }
  }

  const addCurrentUserToWhitelist = async () => {
    if (!address.value) {
      throw new Error('請先連接錢包')
    }

    try {
      isLoading.value = true
      // 使用新的 addMeToWhitelist 函數，更簡單
      await addMeToWhitelist()
      isInWhitelist.value = true
      alert('已成功加入白名單！')
      // 刷新資產顯示
      await loadAssets(address.value)
    } catch (error) {
      console.error('Failed to add to whitelist:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const refreshAssets = async () => {
    if (address.value) {
      await loadAssets(address.value)
    }
  }

  onMounted(() => {
    if (typeof window.ethereum !== 'undefined') {
      // 監聽帳戶變更
      onAccountsChanged(async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          address.value = accounts[0] || null
          if (address.value) {
            await loadAssets(address.value)
            await checkWhitelistStatus(address.value)
          }
        }
      })

      // 監聽鏈變更
      onChainChanged(() => {
        window.location.reload()
      })
    }
  })

  onUnmounted(() => {
    removeAllListeners()
  })

  return {
    address,
    assets,
    isLoading,
    isInWhitelist,
    connect,
    switchAccount,
    disconnect,
    refreshAssets,
    addCurrentUserToWhitelist
  }
}

declare global {
  interface Window {
    ethereum?: any
  }
}
