<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useWallet } from '@/composables/useWallet'
import Button from '@/components/ui/Button.vue'

const route = useRoute()
const { address, connect } = useWallet()

const navItems = [
  { href: '/wallet', label: 'Wallet' },
  { href: '/loan', label: 'Loan' },
  { href: '/payment', label: 'Payment' },
]

const isActive = (href: string) => {
  return route.path === href
}
</script>

<template>
  <nav class="bg-card border-b border-border/50 sticky top-0 z-50 backdrop-blur-sm bg-card/95">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-12">
          <RouterLink to="/wallet" class="flex items-center gap-2">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E6%88%AA%E5%9C%96%202025-10-31%2023.02.23-7sZu0GS6uTkdg2Y0rEKl0rHnKVHDno.png"
              alt="TokenPay Logo"
              class="w-8 h-8 rounded-lg"
            />
            <span class="text-xl font-medium text-foreground">TokenPay</span>
          </RouterLink>

          <div class="flex items-center gap-6">
            <RouterLink
              v-for="item in navItems"
              :key="item.href"
              :to="item.href"
            >
              <div class="relative group">
                <span
                  :class="[
                    'block px-2 py-2 text-sm font-light transition-colors',
                    isActive(item.href)
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  ]"
                >
                  {{ item.label }}
                </span>
                <div
                  v-if="isActive(item.href)"
                  class="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full"
                />
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Wallet Connection -->
        <div>
          <div
            v-if="address"
            class="px-4 py-2 rounded-lg bg-muted text-sm font-normal text-foreground"
          >
            {{ address.slice(0, 6) }}...{{ address.slice(-4) }}
          </div>
          <Button
            v-else
            @click="connect"
            variant="outline"
            class="rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all bg-transparent font-normal"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    </div>
  </nav>
</template>
