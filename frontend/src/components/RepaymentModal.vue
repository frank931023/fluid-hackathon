<script setup lang="ts">
import { ref } from 'vue'
import type { Loan } from '@/composables/useLoans'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import { X, CheckCircle } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  loan: Loan
}

interface Emits {
  (e: 'close'): void
  (e: 'repaySuccess', loanId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const repayAmount = ref(props.loan.borrowedAmount.toString())
const isProcessing = ref(false)
const isSuccess = ref(false)

const handleRepay = async () => {
  isProcessing.value = true

  // Simulate transaction
  await new Promise((resolve) => setTimeout(resolve, 2000))

  isProcessing.value = false
  isSuccess.value = true

  emit('repaySuccess', props.loan.id)

  // Auto close after success
  setTimeout(() => {
    emit('close')
    isSuccess.value = false
  }, 2000)
}

const setMaxAmount = () => {
  repayAmount.value = props.loan.borrowedAmount.toString()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div class="bg-card rounded-lg shadow-sm w-full max-w-md mx-4 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h2 class="text-xl font-medium text-foreground">Repay Loan</h2>
          <button
            @click="emit('close')"
            class="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <div v-if="isSuccess" class="text-center py-8">
            <div
              class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle class="w-8 h-8 text-green-600" />
            </div>
            <h3 class="text-lg font-medium text-foreground mb-2">Repayment Successful!</h3>
            <p class="text-sm text-muted-foreground font-light">
              Your loan has been repaid successfully
            </p>
          </div>

          <template v-else>
            <!-- Loan Details -->
            <div class="bg-muted/30 rounded-lg p-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground font-light">Collateral Asset</span>
                <span class="font-normal text-foreground">{{ loan.collateralAmount }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground font-light">Merchant</span>
                <span class="font-normal text-foreground">{{ loan.merchant }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground font-light">Total Borrowed</span>
                <span class="font-normal text-foreground">
                  US${{
                    loan.borrowedAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}
                  USDC
                </span>
              </div>
            </div>

            <!-- Repayment Amount -->
            <div class="space-y-2">
              <Label for="repayAmount" class="text-sm font-normal text-muted-foreground">
                Repayment Amount (USDC)
              </Label>
              <div class="relative">
                <Input
                  id="repayAmount"
                  v-model="repayAmount"
                  type="number"
                  class="rounded-lg pr-20 font-light"
                  placeholder="0.00"
                />
                <button
                  @click="setMaxAmount"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-normal text-primary hover:text-primary/80 transition-colors"
                >
                  MAX
                </button>
              </div>
              <p class="text-xs text-muted-foreground font-light">
                Available balance: US$1,000.00 USDC
              </p>
            </div>

            <!-- Payment Method -->
            <div class="space-y-2">
              <Label class="text-sm font-normal text-muted-foreground">Payment Method</Label>
              <div class="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span class="text-primary font-medium text-sm">$</span>
                  </div>
                  <div>
                    <p class="font-normal text-foreground text-sm">USDC</p>
                    <p class="text-xs text-muted-foreground font-light">USD Coin (Stablecoin)</p>
                  </div>
                </div>
                <CheckCircle class="w-5 h-5 text-primary" />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 pt-2">
              <Button
                @click="emit('close')"
                variant="outline"
                class="flex-1 rounded-lg bg-transparent font-normal"
                :disabled="isProcessing"
              >
                Cancel
              </Button>
              <Button
                @click="handleRepay"
                class="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-normal"
                :disabled="isProcessing || !repayAmount || Number.parseFloat(repayAmount) <= 0"
              >
                {{ isProcessing ? 'Processing...' : 'Confirm Repayment' }}
              </Button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
