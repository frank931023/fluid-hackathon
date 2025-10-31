<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Slider from '@/components/ui/Slider.vue'
import { AlertTriangle, CheckCircle, TrendingDown } from 'lucide-vue-next'

interface Props {
  loanId: string
  collateralAsset: string
  collateralAmount: number
  borrowedAmount: number
}

interface Emits {
  (e: 'liquidate'): void
  (e: 'repay'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentPrice = ref(100)
const isLiquidated = ref(false)
const priceHistory = ref<{ time: string; collateralValue: number; liquidationValue: number }[]>([])

const LIQUIDATION_THRESHOLD = 0.8

const collateralValue = computed(() => currentPrice.value * props.collateralAmount)
const liquidationValue = computed(() => props.borrowedAmount / LIQUIDATION_THRESHOLD)
const liquidationPriceUSD = computed(() => liquidationValue.value / props.collateralAmount)
const healthFactor = computed(() => (collateralValue.value * LIQUIDATION_THRESHOLD) / props.borrowedAmount)
const priceDropRisk = computed(() => Math.max(0, 1 - liquidationPriceUSD.value / currentPrice.value))

const getHealthFactorColor = computed(() => {
  if (healthFactor.value >= 1.25) return 'text-green-600'
  if (healthFactor.value >= 1.0) return 'text-yellow-600'
  return 'text-red-600'
})

const getHealthFactorBg = computed(() => {
  if (healthFactor.value >= 1.25) return 'bg-green-100 border-green-200'
  if (healthFactor.value >= 1.0) return 'bg-yellow-100 border-yellow-200'
  return 'bg-red-100 border-red-200'
})

const getHealthFactorBadge = computed(() => {
  if (healthFactor.value >= 1.25) return 'Safe'
  if (healthFactor.value >= 1.0) return 'Warning'
  return 'Critical'
})

const minChartPrice = computed(() => {
  const historyPrices = priceHistory.value.map(h => h.collateralValue)
  return Math.min(...historyPrices, liquidationValue.value) * 0.8
})

const maxChartPrice = computed(() => {
  const historyPrices = priceHistory.value.map(h => h.collateralValue)
  return Math.max(...historyPrices, collateralValue.value) * 1.2
})

const chartRange = computed(() => maxChartPrice.value - minChartPrice.value)

const liquidationLinePosition = computed(() => {
  return ((maxChartPrice.value - liquidationValue.value) / chartRange.value) * 100
})

const generateChartPath = computed(() => {
  if (priceHistory.value.length === 0) return ''
  
  const points = priceHistory.value.map((point, index) => {
    const x = (index / (priceHistory.value.length - 1)) * 100
    const y = ((maxChartPrice.value - point.collateralValue) / chartRange.value) * 100
    return `${x},${y}`
  })
  
  return points.join(' ')
})

const handlePriceSimulation = (value: number[]) => {
  currentPrice.value = value[0] || 100
}

watch(collateralValue, (newValue) => {
  if (newValue <= liquidationValue.value && !isLiquidated.value) {
    console.log('🚨 清算觸發:', { collateralValue: newValue, liquidationValue: liquidationValue.value })
    isLiquidated.value = true
    emit('liquidate')
  }
})

let priceUpdateInterval: number | null = null

onMounted(() => {
  // Generate initial price history
  const history = []
  for (let i = 20; i >= 0; i--) {
    const time = new Date(Date.now() - i * 5000).toLocaleTimeString()
    const price = 100 + Math.random() * 10 - 5
    const cv = price * props.collateralAmount
    const lv = props.borrowedAmount / LIQUIDATION_THRESHOLD
    history.push({ time, collateralValue: cv, liquidationValue: lv })
  }
  priceHistory.value = history

  // Simulate real-time price updates
  priceUpdateInterval = window.setInterval(() => {
    if (isLiquidated.value) return

    const newPrice = currentPrice.value + (Math.random() - 0.5) * 2
    currentPrice.value = Math.max(newPrice, 0)

    const cv = newPrice * props.collateralAmount
    const lv = props.borrowedAmount / LIQUIDATION_THRESHOLD
    priceHistory.value = [
      ...priceHistory.value.slice(-19),
      {
        time: new Date().toLocaleTimeString(),
        collateralValue: cv,
        liquidationValue: lv,
      },
    ]
  }, 3000)
})

onUnmounted(() => {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval)
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Status Banner -->
    <Card
      v-if="isLiquidated"
      class="p-4 rounded-xl border-red-200 bg-red-50"
    >
      <div class="flex items-center gap-3">
        <AlertTriangle class="w-5 h-5 text-red-600" />
        <div>
          <p class="font-medium text-red-900">Position Liquidated</p>
          <p class="text-sm text-red-700">Liquidated: collateral value fell below D/0.8</p>
        </div>
      </div>
    </Card>

    <Card
      v-else-if="healthFactor < 1.2"
      class="p-4 rounded-xl border-yellow-200 bg-yellow-50"
    >
      <div class="flex items-center gap-3">
        <AlertTriangle class="w-5 h-5 text-yellow-600" />
        <div>
          <p class="font-medium text-yellow-900">Warning: Low Health Factor</p>
          <p class="text-sm text-yellow-700">Your position is at risk of liquidation</p>
        </div>
      </div>
    </Card>

    <Card v-else class="p-4 rounded-xl border-green-200 bg-green-50">
      <div class="flex items-center gap-3">
        <CheckCircle class="w-5 h-5 text-green-600" />
        <div>
          <p class="font-medium text-green-900">Position Healthy</p>
          <p class="text-sm text-green-700">Your collateral is well above liquidation threshold</p>
        </div>
      </div>
    </Card>

    <!-- Liquidation Monitor -->
    <Card class="p-6 rounded-xl shadow-sm border-border/50">
      <h3 class="text-lg font-medium mb-4">Liquidation Monitor</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-sm text-muted-foreground mb-1">Collateral Value</p>
          <p class="text-lg font-medium">
            ${{
              collateralValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ collateralAmount }} {{ collateralAsset }}
          </p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground mb-1">Borrowed</p>
          <p class="text-lg font-medium">
            ${{
              borrowedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }}
          </p>
          <p class="text-sm text-muted-foreground">USDC</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground mb-1">Liquidation Value</p>
          <p class="text-lg font-medium text-red-600">
            ${{
              liquidationValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }}
          </p>
          <p class="text-sm text-muted-foreground">D / 0.8</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground mb-1">Health Factor</p>
          <div class="flex items-center gap-2">
            <p :class="`text-2xl font-semibold ${getHealthFactorColor}`">
              {{ healthFactor.toFixed(3) }}
            </p>
            <Badge :class="`${getHealthFactorBg} font-normal`">
              {{ getHealthFactorBadge }}
            </Badge>
          </div>
        </div>
      </div>
    </Card>

    <!-- Price Chart -->
    <Card class="p-6 rounded-xl shadow-sm border-border/50">
      <h3 class="text-lg font-medium mb-4">抵押品價值歷史走勢</h3>
      <div class="relative h-[300px] bg-muted/30 rounded-lg p-4">
        <!-- Y-axis labels -->
        <div class="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground w-16">
          <span>${{ Math.round(maxChartPrice) }}</span>
          <span class="text-red-600 font-medium">${{ Math.round(liquidationValue) }}</span>
          <span>${{ Math.round(minChartPrice) }}</span>
        </div>

        <!-- Chart area -->
        <div class="ml-16 h-full relative">
          <!-- Liquidation line -->
          <div
            class="absolute left-0 right-0 border-t-2 border-red-500 border-dashed z-10"
            :style="{ top: `${liquidationLinePosition}%` }"
          >
            <span
              class="absolute right-0 -top-5 text-xs text-red-600 font-medium bg-background px-2 py-0.5 rounded border border-red-300"
            >
              清算線: ${{ liquidationValue.toFixed(2) }}
            </span>
          </div>

          <!-- Current price line -->
          <div
            class="absolute left-0 right-0 border-t-2 border-blue-500 border-dashed z-10"
            :style="{
              top: `${((maxChartPrice - collateralValue) / chartRange) * 100}%`,
            }"
          >
            <span
              class="absolute left-0 -top-5 text-xs text-blue-600 font-medium bg-background px-2 py-0.5 rounded border border-blue-300"
            >
              當前: ${{ collateralValue.toFixed(2) }}
            </span>
          </div>

          <!-- Price line chart -->
          <svg class="w-full h-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-green-600"
              :points="generateChartPath"
            />
          </svg>
        </div>
      </div>
    </Card>

    <!-- Real-time Metrics -->
    <Card class="p-6 rounded-xl shadow-sm border-border/50">
      <h3 class="text-lg font-medium mb-4">Real-time Metrics</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p class="text-sm text-muted-foreground mb-1">Current Price</p>
          <p class="text-2xl font-semibold text-[#1F6FEB]">${{ currentPrice.toFixed(2) }}</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground mb-1">Collateral Value</p>
          <p class="text-2xl font-semibold">${{ collateralValue.toFixed(2) }}</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground mb-1">Liquidation Price</p>
          <p class="text-2xl font-semibold text-red-600">${{ liquidationPriceUSD.toFixed(2) }}</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground mb-1">Price Drop Risk</p>
          <div class="flex items-center gap-2">
            <TrendingDown class="w-4 h-4 text-red-600" />
            <p class="text-2xl font-semibold text-red-600">
              {{ (priceDropRisk * 100).toFixed(1) }}%
            </p>
          </div>
        </div>
      </div>
    </Card>

    <!-- Price Simulation -->
    <Card class="p-6 rounded-xl shadow-sm border-border/50">
      <h3 class="text-lg font-medium mb-4">Price Simulation</h3>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between mb-2">
            <p class="text-sm text-muted-foreground">Simulate Price Change</p>
            <p class="text-sm font-medium">${{ currentPrice.toFixed(2) }}</p>
          </div>
          <Slider
            :model-value="[currentPrice]"
            @update:model-value="handlePriceSimulation"
            :min="50"
            :max="150"
            :step="0.5"
            class="w-full"
          />
          <div class="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>$50</span>
            <span>$150</span>
          </div>
        </div>
        <div class="flex gap-3">
          <Button
            @click="currentPrice = Math.max(currentPrice - 5, 50)"
            variant="outline"
            class="flex-1 rounded-lg"
          >
            -$5
          </Button>
          <Button
            @click="currentPrice = Math.min(currentPrice + 5, 150)"
            variant="outline"
            class="flex-1 rounded-lg"
          >
            +$5
          </Button>
          <Button @click="currentPrice = 100" variant="outline" class="flex-1 rounded-lg">
            Reset
          </Button>
        </div>
      </div>
    </Card>

    <!-- Action Buttons -->
    <div class="flex gap-4">
      <Button
        @click="emit('repay')"
        :disabled="isLiquidated"
        class="flex-1 bg-[#1F6FEB] hover:bg-[#1F6FEB]/90 text-white rounded-xl py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isLiquidated ? 'Position Liquidated' : 'Repay Now' }}
      </Button>
    </div>
  </div>
</template>
