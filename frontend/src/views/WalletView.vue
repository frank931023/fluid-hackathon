<script setup lang="ts">
import { computed } from 'vue'
import { useWallet } from '@/composables/useWallet'
import Navbar from '@/components/Navbar.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { Wallet } from 'lucide-vue-next'

const { address, connect, switchAccount, disconnect, assets, isInWhitelist, addCurrentUserToWhitelist, isLoading } = useWallet()

const totalBalance = computed(() => {
  return assets.value.reduce((sum, asset) => sum + asset.usdValue, 0)
})

const handleAddToWhitelist = async () => {
  try {
    await addCurrentUserToWhitelist()
  } catch (error) {
    alert('加入白名單失敗: ' + (error as Error).message)
  }
}

const handleSwitchAccount = async () => {
  try {
    await switchAccount()
  } catch (error) {
    console.error('Failed to switch account:', error)
  }
}
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
          <div class="flex gap-2 mt-3 justify-center">
            <Button
              @click="handleSwitchAccount"
              variant="outline"
              size="sm"
              class="rounded-lg font-normal bg-transparent"
            >
              Switch Account
            </Button>
            <Button
              @click="disconnect"
              variant="outline"
              size="sm"
              class="rounded-lg font-normal bg-transparent"
            >
              Disconnect Wallet
            </Button>
          </div>
        </div>

        <!-- 白名單狀態卡片 -->
        <Card v-if="!isInWhitelist" class="p-6 rounded-lg shadow-sm border-border/50 bg-orange-50 border-orange-200 mb-6">
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-orange-600 text-xl">⚠️</span>
              </div>
              <div class="flex-1">
                <h3 class="font-medium text-orange-900 mb-1">Whitelist Required</h3>
                <p class="text-sm text-orange-700 font-light mb-3">
                  To use lending features and hold tTSLA tokens, you need to join the whitelist first. This is a KYC/AML compliance requirement following ERC-3643 standard.
                </p>
                <Button
                  @click="handleAddToWhitelist"
                  :disabled="isLoading"
                  class="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {{ isLoading ? 'Processing...' : 'Join Whitelist' }}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card class="p-6 rounded-lg shadow-sm border-border/50">
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted-foreground font-light">Total Balance</p>
              <span v-if="isInWhitelist" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                ✓ Verified
              </span>
            </div>
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

        <!-- 完整地址顯示和診斷資訊（調試用） -->
        <div class="space-y-4 mt-8">
          <details class="text-left">
            <summary class="cursor-pointer text-xs text-blue-600 hover:text-blue-800 list-none">
              click to see full address and diagnostics info
            </summary>
            <div class="mt-3 p-4 bg-gray-50 rounded-lg text-left space-y-2">
            <div>
              <p class="text-xs font-semibold text-gray-700 mb-1">Your MetaMask Address:</p>
              <p class="text-xs font-mono bg-white p-2 rounded border break-all">{{ address }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-700 mb-1">Expected Hardhat Account 0:</p>
              <p class="text-xs font-mono bg-white p-2 rounded border break-all">0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-700 mb-1">Address Verification:</p>
              <p class="text-xs font-semibold mb-1" :class="address?.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' ? 'text-green-700' : 'text-red-700'">
                {{ address?.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' ? 'Address Matching' : 'Address Not Matching' }}
              </p>
              <p v-if="address?.toLowerCase() !== '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'" class="text-xs text-red-600 mt-2">
                <strong>Issue:</strong> You're not using Hardhat Account 0.<br>
                <strong>Solution:</strong> Import this private key in MetaMask:<br>
                <code class="bg-yellow-100 px-1">0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</code>
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-700 mb-1">Whitelist Status:</p>
              <p class="text-xs" :class="isInWhitelist ? 'text-green-700' : 'text-orange-700'">
                {{ isInWhitelist ? 'Whitelisted' : '⚠️ Not Whitelisted' }}
              </p>
            </div>
          </div>
          </details>
        </div>
      </div>
    </main>
  </div>
</template>
