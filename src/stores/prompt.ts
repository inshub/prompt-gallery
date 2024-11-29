import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Prompt, PromptCategory } from '../types/prompt'
import { prompts as localPrompts, tags as localTags } from '../data/prompts'

export const usePromptStore = defineStore('prompt', () => {
  const prompts = ref<Prompt[]>(localPrompts)
  const loading = ref(false)
  const tags = ref(localTags)
  const currentPage = ref(1)
  const pageSize = ref(6)
  const selectedTags = ref<string[]>([])
  const searchQuery = ref('')
  const currentCategory = ref<PromptCategory>('Claude')

  const categories = computed(() => [
    { id: 'Claude', name: 'Claude', count: prompts.value.filter(p => p.category === 'Claude').length },
    { id: 'ChatGPT', name: 'ChatGPT', count: prompts.value.filter(p => p.category === 'ChatGPT').length },
    { id: 'Midjourney', name: 'Midjourney', count: prompts.value.filter(p => p.category === 'Midjourney').length },
  ])

  const filteredAndSortedPrompts = computed(() => {
    let filtered = [...prompts.value]

    filtered = filtered.filter(prompt => prompt.category === currentCategory.value)

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(prompt => 
        prompt.prompt.toLowerCase().includes(query) ||
        prompt.author.toLowerCase().includes(query)
      )
    }

    if (selectedTags.value.length > 0) {
      filtered = filtered.filter(prompt => {
        const promptKeywords = prompt.prompt.toLowerCase()
        return selectedTags.value.some(tag => 
          promptKeywords.includes(tag.toLowerCase())
        )
      })
    }

    return filtered.sort((a, b) => {
      if (a.starred && !b.starred) return -1
      if (!a.starred && b.starred) return 1
      return new Date(b.publish).getTime() - new Date(a.publish).getTime()
    })
  })

  const paginatedPrompts = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredAndSortedPrompts.value.slice(start, end)
  })

  const totalPages = computed(() => 
    Math.ceil(filteredAndSortedPrompts.value.length / pageSize.value)
  )

  const setPage = (page: number) => {
    currentPage.value = page
  }

  const toggleTag = (tag: string) => {
    const index = selectedTags.value.indexOf(tag)
    if (index === -1) {
      selectedTags.value.push(tag)
    } else {
      selectedTags.value.splice(index, 1)
    }
    currentPage.value = 1
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
  }

  const setCategory = (category: PromptCategory) => {
    currentCategory.value = category
    currentPage.value = 1
    selectedTags.value = []
    searchQuery.value = ''
  }

  return {
    prompts: paginatedPrompts,
    loading,
    tags,
    fetchPrompts: () => {},
    currentPage,
    totalPages,
    setPage,
    selectedTags,
    toggleTag,
    searchQuery,
    setSearchQuery,
    categories,
    currentCategory,
    setCategory
  }
}) 