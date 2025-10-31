<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useWallet } from '@/composables/useWallet'
import { useLoans, type Loan } from '@/composables/useLoans'
import Navbar from '@/components/Navbar.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import Input from '@/components/ui/Input.vue'
import RepaymentModal from '@/components/RepaymentModal.vue'
import LiquidationMonitor from '@/components/LiquidationMonitor.vue'
import { AlertCircle, CheckCircle, Filter, Search, ArrowUpDown, Activity } from 'lucide-vue-next'

const { address } = useWallet()
const { loans, completeLoan, liquidateLoan, loadUserLoan } = useLoans()

// 當用戶地址變化時，載入貸款數據
watch(address, async (newAddress) => {
  if (newAddress) {
    await loadUserLoan(newAddress)
  }
}, { immediate: true })

// 定期更新貸款數據（每 10 秒）
onMounted(() => {
  const interval = setInterval(async () => {
    if (address.value) {
      await loadUserLoan(address.value)
    }
  }, 10000)

  // 清理
  return () => clearInterval(interval)
})

const selectedLoan = ref<string | null>(null)
const repayModalOpen = ref(false)
const repayingLoan = ref<Loan | null>(null)
const filter = ref<'all' | 'active' | 'completed' | 'liquidated'>('all')
const searchQuery = ref('')
const viewMode = ref<'list' | 'monitor'>('list')

const filteredLoans = computed(() => {
  return loans.value
    .filter((loan) => {
      if (filter.value === 'all') return true
      return loan.status === filter.value
    })
    .filter((loan) => {
      if (!searchQuery.value) return true
      return (
        loan.merchantName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        loan.merchant.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        loan.collateralAsset.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    })
})

const totalDebt = computed(() => {
  return loans.value
    .filter((loan) => loan.status === 'active')
    .reduce((sum, loan) => sum + loan.borrowedAmount, 0)
})

const getStatusBadge = (status: 'active' | 'completed' | 'liquidated') => {
  switch (status) {
    case 'active':
      return {
        class: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 font-normal',
        icon: AlertCircle,
        label: 'Active',
      }
    case 'completed':
      return {
        class: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200 font-normal',
        icon: CheckCircle,
        label: 'Completed',
      }
    case 'liquidated':
      return {
        class: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-normal',
        icon: AlertCircle,
        label: 'Liquidated',
      }
  }
}

const handleRepay = (loan: Loan) => {
  repayingLoan.value = loan
  repayModalOpen.value = true
}

const handleRepaySuccess = (loanId: string) => {
  completeLoan(loanId)
}

const calculateRiskMetrics = (loan: Loan) => {
  const currentLTV = (loan.borrowedAmount / loan.currentValue) * 100
  const healthFactor = (loan.currentValue * 0.8) / loan.borrowedAmount
  const maxBorrowLimit = loan.collateralValue * 0.5
  const liquidationThreshold = 80

  return {
    currentLTV,
    healthFactor,
    maxBorrowLimit,
    liquidationThreshold,
  }
}

const generatePriceHistory = (loan: Loan) => {
  const points = 50
  const data = []
  const currentValue = loan.currentValue
  const initialValue = loan.collateralValue

  // 生成從初始值到當前值的波動曲線，增加更明顯的價格浮動
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1)
    const baseValue = initialValue + (currentValue - initialValue) * progress

    // 組合多個波動模式以產生更真實的價格變化
    const wave1 = Math.sin(i * 0.8) * (initialValue * 0.03) // 主要波動
    const wave2 = Math.sin(i * 1.5 + 1) * (initialValue * 0.02) // 次要波動
    const randomNoise = (Math.random() - 0.5) * (initialValue * 0.015) // 隨機噪音
    const volatility = wave1 + wave2 + randomNoise

    data.push(baseValue + volatility)
  }
  return data
}

const generatePriceChartPoints = (loan: Loan) => {
  const priceHistory = generatePriceHistory(loan)
  const maxPrice = Math.max(...priceHistory)
  const minPrice = Math.min(...priceHistory, loan.liquidationPrice)
  const priceRange = maxPrice - minPrice
  
  return priceHistory
    .map((price, i) => {
      const x = (i / (priceHistory.length - 1)) * 100
      const y = ((maxPrice - price) / priceRange) * 100
      return `${x},${y}`
    })
    .join(' ')
}
</script>

<template>
  <div class="min-h-screen bg-secondary">
    <Navbar />
    <main class="container mx-auto px-4 py-8 max-w-6xl">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-medium text-foreground">
          {{ viewMode === 'list' ? 'Active Loans & Repayment' : 'Liquidation Monitor' }}
        </h1>
        <div class="flex gap-2 border border-border rounded-lg overflow-hidden bg-background">
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-4 py-2 text-sm font-normal transition-colors',
              viewMode === 'list'
                ? 'bg-background text-foreground'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground'
            ]"
          >
            Loan List
          </button>
          <button
            @click="viewMode = 'monitor'"
            :class="[
              'px-4 py-2 text-sm font-normal transition-colors border-l border-border flex items-center gap-2',
              viewMode === 'monitor'
                ? 'bg-background text-foreground'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground'
            ]"
          >
            <Activity class="w-4 h-4" />
            Monitor
          </button>
        </div>
      </div>

      <div v-if="!address">
        <Card class="p-12 rounded-lg shadow-sm border-border/50 text-center">
          <p class="text-muted-foreground font-light">Please connect your wallet to view your loans</p>
        </Card>
      </div>

      <div v-else-if="viewMode === 'monitor'">
        <div v-if="loans.filter((loan) => loan.status === 'active').length === 0">
          <Card class="p-12 rounded-lg shadow-sm border-border/50 text-center">
            <p class="text-muted-foreground font-light">No active loans to monitor</p>
          </Card>
        </div>
        <div v-else class="space-y-6">
          <div
            v-for="loan in loans.filter((loan) => loan.status === 'active')"
            :key="loan.id"
          >
            <Card class="p-6 rounded-xl shadow-sm border-border/50 mb-4">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-medium">{{ loan.merchantName }}</h2>
                  <p class="text-sm text-muted-foreground">Loan ID: {{ loan.id }}</p>
                </div>
                <Badge :class="getStatusBadge(loan.status).class">
                  <component :is="getStatusBadge(loan.status).icon" class="w-3 h-3 mr-1" />
                  {{ getStatusBadge(loan.status).label }}
                </Badge>
              </div>
            </Card>
            <LiquidationMonitor
              :loan-id="loan.id"
              collateral-asset="tTSLA"
              :collateral-amount="20"
              :borrowed-amount="loan.borrowedAmount"
              @liquidate="liquidateLoan(loan.id)"
              @repay="handleRepay(loan)"
            />
          </div>
        </div>
      </div>

      <div v-else>
        <Card class="p-6 rounded-lg shadow-sm border-border/50 mb-6 bg-linear-to-br from-primary/5 to-primary/10">
          <div class="text-center">
            <p class="text-sm text-muted-foreground font-light mb-2">Total Outstanding Debt</p>
            <p class="text-4xl font-medium text-foreground">
              US${{ totalDebt.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) }}
            </p>
            <p class="text-sm text-muted-foreground font-light mt-1">USDC</p>
          </div>
        </Card>

        <div class="flex items-center gap-3 mb-6">
          <div class="flex gap-0 border border-border rounded-lg overflow-hidden bg-background">
            <button
              @click="filter = 'all'"
              :class="[
                'px-6 py-2 text-sm font-normal transition-colors',
                filter === 'all'
                  ? 'bg-background text-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              ]"
            >
              All
            </button>
            <button
              @click="filter = 'active'"
              :class="[
                'px-6 py-2 text-sm font-normal transition-colors border-l border-border',
                filter === 'active'
                  ? 'bg-background text-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              ]"
            >
              Active
            </button>
            <button
              @click="filter = 'completed'"
              :class="[
                'px-6 py-2 text-sm font-normal transition-colors border-l border-border',
                filter === 'completed'
                  ? 'bg-background text-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              ]"
            >
              Complete
            </button>
            <button
              @click="filter = 'liquidated'"
              :class="[
                'px-6 py-2 text-sm font-normal transition-colors border-l border-border',
                filter === 'liquidated'
                  ? 'bg-background text-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:text-foreground'
              ]"
            >
              Liquidated
            </button>
          </div>

          <Button variant="outline" class="rounded-lg font-normal gap-2 bg-transparent">
            <Filter class="w-4 h-4" />
            Filters
          </Button>

          <div class="flex-1" />

          <div class="relative w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="Search"
              class="pl-10 rounded-lg border-border font-light"
            />
          </div>

          <Button variant="outline" class="rounded-lg font-normal gap-2 bg-transparent">
            <ArrowUpDown class="w-4 h-4" />
            Sort order
          </Button>
        </div>

        <div v-if="filteredLoans.length === 0">
          <Card class="p-12 rounded-lg shadow-sm border-border/50 text-center">
            <p class="text-muted-foreground font-light">
              {{ filter === 'all' ? 'No loans yet' : `No ${filter} loans` }}
            </p>
          </Card>
        </div>

        <div v-else class="space-y-4">
          <Card
            v-for="loan in filteredLoans"
            :key="loan.id"
            :class="[
              'p-6 rounded-lg shadow-sm border-border/50 hover:shadow-md transition-all cursor-pointer',
              loan.status === 'completed' ? 'border-green-200 bg-green-50/30' : '',
              loan.status === 'liquidated' ? 'border-red-200 bg-red-50/30' : ''
            ]"
            @click="selectedLoan = selectedLoan === loan.id ? null : loan.id"
          >
            <div class="space-y-4">
              <div class="flex items-start justify-between">
                <div class="space-y-2">
                  <div class="flex items-center gap-3">
                    <h3 class="text-lg font-medium text-foreground">{{ loan.merchantName }}</h3>
                    <Badge :class="getStatusBadge(loan.status).class">
                      <component :is="getStatusBadge(loan.status).icon" class="w-3 h-3 mr-1" />
                      {{ getStatusBadge(loan.status).label }}
                    </Badge>
                  </div>
                  <div class="text-sm text-muted-foreground space-y-1 font-light">
                    <p>
                      Collateral: {{ loan.collateralAmount }}
                      (US${{ loan.collateralValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) }})
                    </p>
                    <p>
                      Borrowed: {{ loan.borrowedAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) }} {{ loan.borrowedCurrency }}
                    </p>
                  </div>
                </div>
                <Button
                  v-if="loan.status === 'active'"
                  @click.stop="handleRepay(loan)"
                  class="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-normal"
                >
                  Repay Now
                </Button>
                <div
                  v-if="loan.status === 'liquidated'"
                  class="text-sm text-red-600 font-medium bg-red-50 px-4 py-2 rounded-lg border border-red-200"
                >
                  Liquidated
                </div>
              </div>

              <div v-if="selectedLoan === loan.id" class="pt-4 border-t border-border space-y-6 text-sm">
                <!-- 風險指標區域 -->
                <div class="bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 class="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Activity class="w-4 h-4" />
                    風險指標
                  </h4>
                  <div class="grid grid-cols-4 gap-4">
                    <div>
                      <p class="text-muted-foreground font-light text-xs mb-1">
                        Current LTV Ratio
                      </p>
                      <p
                        :class="[
                          'font-semibold text-lg',
                          calculateRiskMetrics(loan).currentLTV > 70
                            ? 'text-red-600'
                            : calculateRiskMetrics(loan).currentLTV > 50
                            ? 'text-orange-600'
                            : 'text-green-600'
                        ]"
                      >
                        {{ calculateRiskMetrics(loan).currentLTV.toFixed(2) }}%
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground font-light text-xs mb-1">
                        Health Factor
                      </p>
                      <p
                        :class="[
                          'font-semibold text-lg',
                          calculateRiskMetrics(loan).healthFactor <= 1.1
                            ? 'text-red-600'
                            : calculateRiskMetrics(loan).healthFactor <= 1.5
                            ? 'text-orange-600'
                            : 'text-green-600'
                        ]"
                      >
                        {{ calculateRiskMetrics(loan).healthFactor.toFixed(3) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground font-light text-xs mb-1">
                        Max Borrow Limit (50%)
                      </p>
                      <p class="font-semibold text-lg text-foreground">
                        ${{ calculateRiskMetrics(loan).maxBorrowLimit.toFixed(2) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground font-light text-xs mb-1">
                        Liquidation Threshold
                      </p>
                      <p class="font-semibold text-lg text-foreground">
                        {{ calculateRiskMetrics(loan).liquidationThreshold }}%
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 基本資訊 -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-muted-foreground font-light">Collateral Asset</p>
                    <p class="font-normal text-foreground">{{ loan.collateralAmount }}</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground font-light">Borrowed Amount</p>
                    <p class="font-normal text-foreground">
                      {{ loan.borrowedAmount }} {{ loan.borrowedCurrency }}
                    </p>
                  </div>
                  <div>
                    <p class="text-muted-foreground font-light">Merchant Address</p>
                    <p class="font-normal text-foreground font-mono text-xs">{{ loan.merchant }}</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground font-light">Purchase Time</p>
                    <p class="font-normal text-foreground">{{ loan.timestamp }}</p>
                  </div>
                </div>

                <!-- Collateral Value History Chart -->
                <div>
                  <p class="text-muted-foreground font-light mb-3">Collateral Value History</p>
                  <div class="relative h-40 bg-muted/30 rounded-lg p-4">
                    <div class="absolute left-0 top-0 bottom-0 text-xs font-light pl-1">
                      <span
                        class="absolute text-foreground"
                        style="top: 0"
                      >
                        ${{ Math.round(Math.max(...generatePriceHistory(loan))) }}
                      </span>
                      <span
                        class="absolute text-red-600 font-medium"
                        :style="{
                          top: `${((Math.max(...generatePriceHistory(loan)) - loan.liquidationPrice) / (Math.max(...generatePriceHistory(loan)) - Math.min(...generatePriceHistory(loan), loan.liquidationPrice))) * 100}%`,
                          transform: 'translateY(-50%)',
                        }"
                      >
                        ${{ Math.round(loan.liquidationPrice) }}
                      </span>
                      <span
                        class="absolute text-foreground"
                        style="bottom: 0"
                      >
                        ${{ Math.round(Math.min(...generatePriceHistory(loan), loan.liquidationPrice)) }}
                      </span>
                    </div>

                    <div class="ml-16 h-full relative">
                      <!-- 清算線 -->
                      <div
                        class="absolute left-0 right-0 border-t-2 border-red-500 border-dashed z-10"
                        :style="{
                          top: `${((Math.max(...generatePriceHistory(loan)) - loan.liquidationPrice) / (Math.max(...generatePriceHistory(loan)) - Math.min(...generatePriceHistory(loan), loan.liquidationPrice))) * 100}%`,
                        }"
                      >
                        <span class="absolute right-0 -top-5 text-xs text-red-600 font-medium bg-background px-2 py-0.5 rounded border border-red-300">
                          Liquidation
                        </span>
                      </div>

                      <!-- 價格曲線 -->
                      <svg class="w-full h-full" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="currentColor"
                          stroke-width="3"
                          :class="[
                            loan.currentValue <= loan.liquidationPrice * 1.1
                              ? 'text-red-600'
                              : loan.currentValue <= loan.liquidationPrice * 1.3
                              ? 'text-orange-600'
                              : 'text-green-600'
                          ]"
                          :points="generatePriceChartPoints(loan)"
                        />
                      </svg>
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-4 mt-4 text-xs">
                    <div>
                      <p class="text-muted-foreground font-light">Initial Value</p>
                      <p class="font-normal text-foreground">
                        ${{ loan.collateralValue.toFixed(2) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground font-light">Current Value</p>
                      <p
                        :class="[
                          'font-semibold',
                          loan.currentValue <= loan.liquidationPrice * 1.1
                            ? 'text-red-600'
                            : 'text-green-600'
                        ]"
                      >
                        ${{ loan.currentValue.toFixed(2) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground font-light">Liquidation Price</p>
                      <p class="font-medium text-red-600">
                        ${{ loan.liquidationPrice.toFixed(2) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>

    <!-- Repayment Modal -->
    <RepaymentModal
      v-if="repayingLoan"
      :is-open="repayModalOpen"
      :loan="repayingLoan"
      @close="() => { repayModalOpen = false; repayingLoan = null }"
      @repay-success="handleRepaySuccess"
    />
  </div>
</template>
