<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWallet } from '@/composables/useWallet'
import { useLoans } from '@/composables/useLoans'
import { getRWAPrice, CONTRACT_ADDRESSES } from '@/services/contracts'
import Navbar from '@/components/Navbar.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Select from '@/components/ui/Select.vue'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-vue-next'

type TransactionLog = {
  id: string
  timestamp: string
  topic: string
  status: 'success' | 'error' | 'warning'
  details: string
}

const MERCHANT_NAMES = [
  'Starbucks',
  'Apple Store',
  'Amazon',
  'Nike',
  "McDonald's",
  'Walmart',
  'Target',
  'Best Buy',
  'Whole Foods',
  'Tesla',
  'Costco',
  'Home Depot',
]

const TOKENIZED_ASSETS = [
  {
    id: 'eth',
    name: 'Tokenized Tesla Stock',
    symbol: 'tTSLA',
    value: 200,
    contractAddress: CONTRACT_ADDRESSES.Mock_RWA_Token,
  },
]

const { address, refreshAssets, assets } = useWallet()
const { executeLockAndBorrow } = useLoans()

const merchantAddress = ref('')
const amount = ref('')
const selectedAsset = ref('')
const logs = ref<TransactionLog[]>([])
const expandedLog = ref<string | null>(null)
const qrModalOpen = ref(false)
const qrData = ref<{ amount: string; merchant: string } | null>(null)

const contractAddresses = {
  network: 'localhost',
  fakeUSDC: CONTRACT_ADDRESSES.Mock_USDC,
  lendingPool: CONTRACT_ADDRESSES.FluidPay_LendingPool,
}

const selectedAssetOptions = TOKENIZED_ASSETS.map(asset => ({
  value: asset.id,
  label: `${asset.name} (${asset.symbol}) - $${asset.value.toLocaleString()}`,
}))

const selectedAssetContract = computed(() => {
  const asset = TOKENIZED_ASSETS.find(a => a.id === selectedAsset.value)
  return asset?.contractAddress || 'Select an asset to view contract'
})

const addLog = (topic: string, status: TransactionLog['status'], details: string) => {
  const log: TransactionLog = {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date().toLocaleString(),
    topic,
    status,
    details,
  }
  logs.value = [log, ...logs.value]
}

const handleBorrowAndPay = async () => {
  if (!address.value) {
    addLog('Wallet Connection', 'error', 'Please connect your wallet first')
    return
  }

  if (!merchantAddress.value || !amount.value || !selectedAsset.value) {
    addLog('Form Validation', 'error', 'Please fill in all required fields')
    return
  }

  // 目前只支持 tTSLA 作為抵押品
  if (selectedAsset.value !== 'eth') {
    addLog('Asset Error', 'error', 'Currently only tTSLA is supported as collateral')
    return
  }

  const randomMerchantName = MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)]

  addLog(
    'Transaction Initiated',
    'warning',
    `Borrowing ${amount.value} USDC with tTSLA as collateral`
  )

  try {
    // 獲取當前 tTSLA 價格
    const rwaPrice = await getRWAPrice()
    const rwaPriceNum = parseFloat(rwaPrice)

    // 確保 amount 是字符串
    const borrowAmountStr = String(amount.value)
    const borrowAmountNum = parseFloat(borrowAmountStr)
    
    // 計算需要抵押的 RWA 數量
    // LTV = 50%, 所以需要抵押價值 = 借款金額 * 2
    const requiredCollateralValue = borrowAmountNum * 2 // 50% LTV
    const rwaAmountToLock = (requiredCollateralValue / rwaPriceNum).toFixed(4)

    // 檢查用戶是否有足夠的 tTSLA
    const ttslaAsset = assets.value.find(a => a.symbol === 'tTSLA')
    if (!ttslaAsset || ttslaAsset.balance < parseFloat(rwaAmountToLock)) {
      addLog(
        'Insufficient Balance',
        'error',
        `需要 ${rwaAmountToLock} tTSLA，但您只有 ${ttslaAsset?.balance || 0} tTSLA`
      )
      return
    }

    console.log('🔍 準備借貸參數:')
    console.log('  RWA Amount:', rwaAmountToLock, 'Type:', typeof rwaAmountToLock)
    console.log('  USDC Amount:', borrowAmountStr, 'Type:', typeof borrowAmountStr)

    // 執行真實的鏈上交易
    // 確保所有參數都是字符串
    await executeLockAndBorrow(
      String(rwaAmountToLock),
      String(borrowAmountStr),
      address.value,
      randomMerchantName
    )

    addLog(
      'Borrow & Pay Successful',
      'success',
      `Successfully borrowed ${amount.value} USDC and paid to ${randomMerchantName}`
    )

    // 刷新資產餘額
    await refreshAssets()

    qrData.value = { amount: amount.value, merchant: merchantAddress.value }
    qrModalOpen.value = true

    merchantAddress.value = ''
    amount.value = ''
    selectedAsset.value = ''
  } catch (error) {
    addLog(
      'Transaction Failed',
      'error',
      `Failed to borrow: ${(error as Error).message}`
    )
    console.error('Borrow and pay failed:', error)
  }
}

const getStatusBadge = (status: TransactionLog['status']) => {
  switch (status) {
    case 'success':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircle2,
        label: 'Success',
      }
    case 'error':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: XCircle,
        label: 'Error',
      }
    case 'warning':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        icon: AlertCircle,
        label: 'In Progress',
      }
  }
}
</script>

<template>
  <div class="min-h-screen bg-secondary">
    <Navbar />
    <main class="container mx-auto px-4 py-8 max-w-5xl">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-medium text-foreground mb-2">Borrow & Collateralize</h1>
        <p class="text-muted-foreground font-light">
          Use your tokenized assets as collateral to borrow USDC instantly
        </p>
      </div>

      <Card class="p-8 rounded-lg shadow-sm border-border/50">
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Left Column - Config & Contracts -->
          <div>
            <h2 class="text-lg font-medium text-foreground mb-6">Contract Configuration</h2>

            <div class="space-y-4 text-sm">
              <div>
                <p class="font-normal text-muted-foreground mb-1">Network</p>
                <p class="text-foreground font-mono font-light">{{ contractAddresses.network }}</p>
              </div>

              <div class="border-t border-border/50 pt-4">
                <p class="font-normal text-muted-foreground mb-1">FakeUSDC</p>
                <p class="text-foreground font-mono text-xs break-all font-light">
                  {{ contractAddresses.fakeUSDC }}
                </p>
              </div>

              <div class="border-t border-border/50 pt-4">
                <p class="font-normal text-muted-foreground mb-1">Tokenized Asset</p>
                <p
                  :class="[
                    'font-mono text-xs break-all font-light',
                    selectedAsset ? 'text-foreground' : 'text-muted-foreground italic'
                  ]"
                >
                  {{ selectedAssetContract }}
                </p>
              </div>

              <div class="border-t border-border/50 pt-4">
                <p class="font-normal text-muted-foreground mb-1">LendingPool</p>
                <p class="text-foreground font-mono text-xs break-all font-light">
                  {{ contractAddresses.lendingPool }}
                </p>
              </div>
            </div>
          </div>

          <!-- Right Column - Payment Form -->
          <div>
            <h2 class="text-lg font-medium text-foreground mb-6">Payment Details</h2>

            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="merchant" class="text-sm font-normal text-muted-foreground">
                  Merchant address
                </Label>
                <Input
                  id="merchant"
                  v-model="merchantAddress"
                  placeholder="0x..."
                  class="rounded-lg font-light"
                />
              </div>

              <div class="space-y-2">
                <Label for="amount" class="text-sm font-normal text-muted-foreground">
                  Amount (USDC)
                </Label>
                <Input
                  id="amount"
                  v-model="amount"
                  type="number"
                  placeholder="1"
                  class="rounded-lg font-light"
                />
              </div>

              <div class="space-y-2">
                <Label for="asset" class="text-sm font-normal text-muted-foreground">
                  Tokenized Asset
                </Label>
                <Select
                  v-model="selectedAsset"
                  :options="selectedAssetOptions"
                  placeholder="Select an asset"
                  class="font-light"
                />
              </div>

              <Button
                @click="handleBorrowAndPay"
                class="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-lg text-base font-normal shadow-sm transition-all mt-6"
              >
                Borrow & Pay
              </Button>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-border/50">
          <h2 class="text-lg font-medium text-foreground mb-4">Transaction Logs</h2>

          <div v-if="logs.length === 0" class="rounded-lg p-8 text-center border border-border/50">
            <p class="text-muted-foreground text-sm font-light">No transactions yet...</p>
          </div>

          <div v-else class="rounded-lg border border-border/50 overflow-hidden">
            <!-- Table Header -->
            <div class="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/30 border-b border-border/50 text-xs font-medium text-muted-foreground">
              <div class="col-span-4">Transaction Topic</div>
              <div class="col-span-3">Timestamp</div>
              <div class="col-span-3">Details</div>
              <div class="col-span-2">Status</div>
            </div>

            <!-- Table Body -->
            <div class="divide-y divide-border/50">
              <div
                v-for="log in logs"
                :key="log.id"
              >
                <div
                  class="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-muted/20 cursor-pointer transition-colors"
                  @click="expandedLog = expandedLog === log.id ? null : log.id"
                >
                  <div class="col-span-4 flex items-center gap-2">
                    <div :class="['p-1.5 rounded-full', getStatusBadge(log.status).bg]">
                      <component :is="getStatusBadge(log.status).icon" class="w-4 h-4" />
                    </div>
                    <span class="text-sm font-light text-foreground">{{ log.topic }}</span>
                  </div>
                  <div class="col-span-3 text-sm font-light text-muted-foreground flex items-center">
                    {{ log.timestamp }}
                  </div>
                  <div class="col-span-3 text-sm font-light text-muted-foreground flex items-center truncate">
                    {{ log.details }}
                  </div>
                  <div class="col-span-2 flex items-center">
                    <span
                      :class="[
                        'px-3 py-1 rounded-full text-xs font-normal',
                        getStatusBadge(log.status).bg,
                        getStatusBadge(log.status).text
                      ]"
                    >
                      {{ getStatusBadge(log.status).label }}
                    </span>
                  </div>
                </div>

                <!-- Expanded Details -->
                <div
                  v-if="expandedLog === log.id"
                  class="px-4 py-4 bg-muted/10 border-t border-border/50"
                >
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="font-normal text-muted-foreground mb-1">Full Details</p>
                      <p class="text-foreground font-light">{{ log.details }}</p>
                    </div>
                    <div>
                      <p class="font-normal text-muted-foreground mb-1">Transaction ID</p>
                      <p class="text-foreground font-mono text-xs font-light">{{ log.id }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </main>

    <!-- QR Code Modal (simplified for now) -->
    <div v-if="qrModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card class="max-w-md w-full mx-4 p-6">
        <h2 class="text-xl font-medium mb-4">Payment QR Code</h2>
        <div class="bg-white p-4 rounded-lg flex justify-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E6%88%AA%E5%9C%96%202025-11-01%2000.57.44-pQzhUG8k2pNzsL3AHd1nufrt0PvzgV.png"
            alt="Payment QR Code"
            class="w-[300px] h-[300px]"
          />
        </div>
        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Amount</span>
            <span class="font-medium">{{ qrData?.amount }} USDC</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Merchant</span>
            <span class="font-medium font-mono text-xs">
              {{ qrData?.merchant?.slice(0, 10) }}...{{ qrData?.merchant?.slice(-8) }}
            </span>
          </div>
        </div>
        <Button @click="qrModalOpen = false" class="w-full mt-6">Close</Button>
      </Card>
    </div>
  </div>
</template>
