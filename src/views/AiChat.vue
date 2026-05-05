<template>
  <div class="ai-chat-page">
    <el-row :gutter="16" class="hero-row">
      <el-col :xs="24" :lg="16">
        <el-card class="hero-card" shadow="never">
          <div class="hero-copy">
            <div>
              <p class="eyebrow">TEXT TO SQL</p>
              <h1>AI 智能问答</h1>
              <p class="hero-desc">
                面向业务数据的自然语言查询。输入问题后，系统会生成只读 SQL、执行查询，并返回结构化结论。
              </p>
            </div>
            <div class="hero-metrics">
              <div class="metric-card">
                <span class="metric-label">最近提问</span>
                <strong class="metric-value">{{ chatHistory.length }}</strong>
              </div>
              <div class="metric-card">
                <span class="metric-label">最近响应时间</span>
                <strong class="metric-value">{{ latestTimestamp || '-' }}</strong>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="sample-card" shadow="never">
          <template #header>
            <span>示例问题</span>
          </template>
          <div class="sample-list">
            <el-button
              v-for="prompt in samplePrompts"
              :key="prompt"
              text
              class="sample-item"
              @click="applyPrompt(prompt)"
            >
              {{ prompt }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :xl="15">
        <el-card class="ask-card">
          <template #header>
            <div class="section-head">
              <span>开始提问</span>
              <el-tag type="info">POST /ai/chat</el-tag>
            </div>
          </template>

          <el-form @submit.prevent>
            <el-form-item>
              <el-input
                v-model="question"
                type="textarea"
                :rows="4"
                resize="none"
                maxlength="300"
                show-word-limit
                placeholder="例如：最近7天有多少次报警？高风险设备分别是哪几台？"
                @keydown.ctrl.enter.prevent="submitQuestion"
              />
            </el-form-item>
            <div class="action-row">
              <el-button type="primary" :loading="loading" @click="submitQuestion">
                发送问题
              </el-button>
              <el-button :disabled="loading" @click="clearCurrent">清空</el-button>
            </div>
          </el-form>

          <el-empty
            v-if="!currentResult && !loading"
            description="输入业务问题后，这里会展示 SQL、原始结果和 AI 总结。"
          />

          <div v-else v-loading="loading" class="result-panel">
            <div class="answer-block">
              <div class="block-title">AI 回答</div>
              <div class="answer-text">{{ currentResult?.answer || '正在生成回答...' }}</div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">提问时间</span>
                <strong>{{ currentResult?.timestamp || '-' }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-label">返回行数</span>
                <strong>{{ currentResult?.queryResult?.length ?? 0 }}</strong>
              </div>
            </div>

            <div class="block">
              <div class="block-title">生成 SQL</div>
              <pre class="sql-box">{{ currentResult?.generatedSql || '-' }}</pre>
            </div>

            <div class="block">
              <div class="block-title">查询结果</div>
              <el-table
                v-if="resultColumns.length"
                :data="currentResult?.queryResult || []"
                max-height="360"
                stripe
              >
                <el-table-column
                  v-for="column in resultColumns"
                  :key="column"
                  :prop="column"
                  :label="column"
                  min-width="140"
                  show-overflow-tooltip
                />
              </el-table>
              <el-empty v-else description="本次查询没有返回明细记录" />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="9">
        <el-card class="history-card">
          <template #header>
            <div class="section-head">
              <span>最近会话</span>
              <el-tag type="success">{{ chatHistory.length }} 条</el-tag>
            </div>
          </template>

          <el-empty v-if="!chatHistory.length" description="暂无提问记录" />

          <div v-else class="history-list">
            <button
              v-for="item in chatHistory"
              :key="item.timestamp + item.question"
              type="button"
              class="history-item"
              @click="currentResult = item"
            >
              <div class="history-time">{{ item.timestamp }}</div>
              <div class="history-question">{{ item.question }}</div>
              <div class="history-answer">{{ item.answer }}</div>
            </button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { chatWithAi, type AiChatResponse } from '@/api/ai'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'

const samplePrompts = [
  '最近7天有多少次报警？',
  '过去7天 AI 自动创建了多少张维修工单？',
  '当前故障状态的设备有多少台？',
  '最近一周每天的产量趋势如何？',
]

const question = ref('')
const loading = ref(false)
const currentResult = ref<AiChatResponse | null>(null)
const chatHistory = ref<AiChatResponse[]>([])

const latestTimestamp = computed(() => chatHistory.value[0]?.timestamp || '')
const resultColumns = computed(() => {
  const firstRow = currentResult.value?.queryResult?.[0]
  return firstRow ? Object.keys(firstRow) : []
})

const applyPrompt = (prompt: string) => {
  question.value = prompt
}

const clearCurrent = () => {
  question.value = ''
  currentResult.value = null
}

const submitQuestion = async () => {
  const trimmedQuestion = question.value.trim()
  if (!trimmedQuestion) {
    ElMessage.warning('请输入业务问题')
    return
  }

  loading.value = true
  try {
    const res = await chatWithAi({ question: trimmedQuestion })
    currentResult.value = res.data
    chatHistory.value = [res.data, ...chatHistory.value].slice(0, 8)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ai-chat-page {
  padding: 20px;
}

.hero-row {
  margin-bottom: 16px;
}

.hero-card,
.sample-card,
.ask-card,
.history-card {
  height: 100%;
}

.hero-card {
  border: none;
  background:
    radial-gradient(circle at top right, rgba(18, 183, 106, 0.18), transparent 35%),
    linear-gradient(135deg, #0f172a 0%, #14213d 48%, #1d3557 100%);
}

.hero-copy {
  min-height: 210px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: #f8fafc;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.24em;
  color: rgba(255, 255, 255, 0.72);
}

.hero-copy h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.1;
}

.hero-desc {
  max-width: 560px;
  margin: 14px 0 0;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.82);
}

.hero-metrics {
  min-width: 220px;
  display: grid;
  gap: 12px;
}

.metric-card {
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}

.metric-label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.metric-value {
  display: block;
  margin-top: 8px;
  font-size: 24px;
}

.sample-list {
  display: grid;
  gap: 8px;
}

.sample-item {
  justify-content: flex-start;
  margin: 0;
  padding: 10px 0;
  white-space: normal;
  text-align: left;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.result-panel {
  display: grid;
  gap: 16px;
}

.answer-block,
.block,
.meta-item {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fbfdff;
}

.answer-block,
.block {
  padding: 16px;
}

.block-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.answer-text {
  line-height: 1.8;
  color: #0f172a;
  white-space: pre-wrap;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  padding: 14px 16px;
}

.meta-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #64748b;
}

.sql-box {
  margin: 0;
  padding: 14px;
  overflow: auto;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.history-list {
  display: grid;
  gap: 12px;
}

.history-item {
  width: 100%;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.history-item:hover {
  transform: translateY(-2px);
  border-color: #93c5fd;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.history-time {
  font-size: 12px;
  color: #64748b;
}

.history-question {
  margin-top: 8px;
  font-weight: 600;
  color: #0f172a;
}

.history-answer {
  margin-top: 8px;
  color: #475569;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .hero-copy {
    flex-direction: column;
  }

  .hero-metrics {
    min-width: auto;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .ai-chat-page {
    padding: 16px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .meta-grid,
  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .action-row {
    flex-wrap: wrap;
  }
}
</style>