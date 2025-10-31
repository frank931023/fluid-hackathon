<script setup lang="ts">
import { computed } from 'vue'
import { useWallet } from '@/composables/useWallet'
import Navbar from '@/components/Navbar.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { Wallet } from 'lucide-vue-next'

const { address, connect, disconnect, assets } = useWallet()

const totalBalance = computed(() => {
  return assets.value.reduce((sum, asset) => sum + asset.usdValue, 0)
})
</script>

<template>
  <div class="min-h-screen bg-secondary">
    <Navbar />
    <main class="container mx-auto px-4 py-8 max-w-4xl">
      <div v-if="!address" class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div class="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet class="w-12 h-12 text-primary" />
        </div>
        <h1 class="text-3xl font-medium text-foreground">Connect Your Wallet</h1>
        <p class="text-muted-foreground text-center max-w-md font-light">
          Connect your wallet to view your assets and start borrowing against your digital collateral
        </p>
        <Button
          @click="connect"
          size="lg"
          class="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-lg shadow-sm transition-all font-normal"
        >
          Connect Wallet
        </Button>
      </div>

      <div v-else class="space-y-6">
        <div class="text-center">
          <h1 class="text-3xl font-medium text-foreground mb-2">Wallet Overview</h1>
          <p class="text-sm text-muted-foreground font-light">
            {{ address.slice(0, 6) }}...{{ address.slice(-4) }}
          </p>
          <Button
            @click="disconnect"
            variant="outline"
            size="sm"
            class="mt-3 rounded-lg font-normal bg-transparent"
          >
            Disconnect Wallet
          </Button>
        </div>

        <Card class="p-6 rounded-lg shadow-sm border-border/50">
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground font-light">Total Balance</p>
            <p class="text-4xl font-medium text-foreground">
              US${{ totalBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) }}
            </p>
          </div>
        </Card>

        <div class="space-y-4">
          <h2 class="text-lg font-medium text-foreground">Assets</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              v-for="asset in assets"
              :key="asset.symbol"
              class="rounded-lg shadow-sm border-border/50 hover:shadow-md transition-shadow cursor-pointer overflow-hidden p-0"
            >
              <div class="bg-gradient-to-br from-primary/10 to-primary/5 h-40 flex items-center justify-center">
                <img
                  v-if="asset.symbol === 'ETH'"
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E6%88%AA%E5%9C%96%202025-11-01%2000.42.31-uIYg3Kej9je4Nq2GPKMZZA1K8GSy30.png"
                  alt="Ethereum"
                  class="w-[100px] h-[100px] rounded-full"
                />
                <img
                  v-else-if="asset.symbol === 'USDC'"
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E6%88%AA%E5%9C%96%202025-11-01%2001.23.38-WB1wQ8YSnOzvLMkIPwQYCh6vyKl9H7.png"
                  alt="USD Coin"
                  class="w-[100px] h-[100px] rounded-full"
                />
                <div
                  v-else
                  class="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <span class="text-3xl font-medium text-primary">{{ asset.symbol.slice(0, 1) }}</span>
                </div>
              </div>

              <div class="p-4 space-y-2">
                <div>
                  <p class="font-medium text-foreground text-lg">{{ asset.name }}</p>
                  <p class="text-sm text-muted-foreground font-light">
                    {{ asset.balance }} {{ asset.symbol }}
                  </p>
                </div>
                <div class="pt-2 border-t border-border/50">
                  <p class="text-xs text-muted-foreground font-light mb-1">Value</p>
                  <p class="font-medium text-foreground">
                    US${{ asset.usdValue.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) }}
                  </p>
                  <p class="text-xs text-muted-foreground font-light mt-1">
                    ${{ asset.price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) }} per {{ asset.symbol }}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
