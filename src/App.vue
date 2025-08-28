<template>
  <div id="app">
    <div class="header">
      <h1>RSS 阅读器</h1>
    </div>
    
    <div class="container">
      <!-- 文章列表 -->
      <div class="sidebar">
        <div class="articles-list">
          <div 
            v-for="article in articles" 
            :key="article.link"
            class="article-card"
            @click="selectArticle(article)"
          >
            <div class="article-title">{{ article.title }}</div>
            <div class="article-meta">
              <div class="article-author">{{ article.author }}</div>
              <div class="article-date">{{ formatDate(article.published) }}</div>
            </div>
            <div class="article-summary">{{ article.summary }}</div>
          </div>
        </div>
      </div>
      
      <!-- 主内容区 -->
      <div class="main" :class="{ 'full-width': selectedArticle }">

        <div v-if="selectedArticle" class="article-content">
          <div class="article-header">
            <h2>{{ selectedArticle.title }}</h2>
            <a 
              :href="selectedArticle.link" 
              target="_blank" 
              rel="noopener noreferrer"
              class="source-link"
            >
              Read source page
            </a>
          </div>
          <div class="article-info">
            <span class="article-author">作者: {{ selectedArticle.author }}</span>
            <span class="article-date">发布日期: {{ formatDate(selectedArticle.published) }}</span>
          </div>
          <div class="article-body" v-html="articleContent"></div>
        </div>
        
        <div v-else class="welcome">
          <h2>欢迎使用 RSS 阅读器</h2>
          <p>请从左侧选择一篇文章开始阅读</p>
          <p>点击文章将在当前页面中显示详细内容</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getArticles, getContent } from './backend'

const articles = ref([])
const selectedArticle = ref(null)
const articleContent = ref('')
const loading = ref(false)
const router = useRouter()
const route = useRoute()

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '未知日期'
  return new Date(timestamp).toLocaleString()
}

// 获取文章列表
const loadArticles = async () => {
  try {
    articles.value = await getArticles()
  } catch (error) {
    console.error('加载文章列表失败:', error)
  }
}

// 选择文章
const selectArticle = async (article) => {
  selectedArticle.value = article
  loading.value = true
  try {
    articleContent.value = await getContent(article.content)
    // 更新URL
    await router.push(`/detail/${encodeURIComponent(article.link)}`)
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

// 根据URL参数自动选择文章
const selectArticleByRoute = async () => {
  if (route.params.link) {
    const link = decodeURIComponent(route.params.link)
    const article = articles.value.find(a => a.link === link)
    if (article) {
      selectedArticle.value = article
      loading.value = true
      try {
        articleContent.value = await getContent(article.content)
      } catch (error) {
        console.error('加载文章失败:', error)
      } finally {
        loading.value = false
      }
    }
  } else {
    selectedArticle.value = null
    articleContent.value = ''
  }
}

onMounted(() => {
  loadArticles()
})

// 监听路由变化
watch(() => route.params.link, () => {
  if (articles.value.length > 0) {
    selectArticleByRoute()
  }
})

// 监听文章列表变化，确保在路由参数存在但文章列表尚未加载时能正确处理
watch(articles, () => {
  if (route.params.link) {
    selectArticleByRoute()
  }
})
</script>

<style scoped>
#app {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  margin: 0;
}

.container {
  display: flex;
  gap: 50px;
}

.sidebar {
  flex-shrink: 0;
}

.articles-list {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  padding: 10px;
}

.article-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  width: 350px;
}

.article-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.article-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.article-summary {
  font-size: 14px;
  color: #555;
  line-height: 1.4;
}

.main {
  flex: 1;
  min-width: 0;
}

.main.full-width {
  width: 100%;
}

.welcome {
  text-align: center;
  padding: 50px 20px;
  color: #666;
}

.article-content h2 {
  margin-top: 0;
  color: #333;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.source-link {
  font-size: 14px;
  color: #409eff;
  text-decoration: none;
  border: 1px solid #409eff;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.source-link:hover {
  background-color: #409eff;
  color: white;
}

.article-info {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}
.article-body {
  line-height: 1.6;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }
}
</style>