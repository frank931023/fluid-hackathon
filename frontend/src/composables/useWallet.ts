import { ref, onMounted } from 'vue'

export interface Asset {
  symbol: string
  name: string
  balance: number
  price: number
  usdValue: number
}

const address = ref<string | null>(null)
const assets = ref<Asset[]>([])

export function useWallet() {
  const connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        address.value = accounts[0]

        // Mock assets data
        assets.value = [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            balance: 1.5,
            price: 3781.3,
            usdValue: 5671.95,
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            balance: 1000,
            price: 1.0,
            usdValue: 1000.0,
          },
          {
            symbol: 'RWA',
            name: 'Real World Asset NFT',
            balance: 3,
            price: 500,
            usdValue: 1500.0,
          },
        ]
      } catch (error) {
        console.error('Failed to connect wallet:', error)
      }
    } else {
      alert('Please install MetaMask or another Web3 wallet')
    }
  }

  const disconnect = () => {
    address.value = null
    assets.value = []
    if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
      console.log('[v0] Wallet disconnected. Reconnecting will prompt for account selection.')
    }
  }

  onMounted(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          address.value = accounts[0] || null
        }
      })
    }
  })

  return {
    address,
    assets,
    connect,
    disconnect,
  }
}

declare global {
  interface Window {
    ethereum?: any
  }
}
