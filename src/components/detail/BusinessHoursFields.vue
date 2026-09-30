<script setup>
import { Field } from '@/components/ui/field'
import TimePicker from '@/components/form/TimePicker.vue'
import { Select } from '@/components/ui/select'
import { WEEK_DAYS, getTimezones } from '@/utils/nodeDetail'

const data = defineModel('data', { type: Object, required: true })
defineProps({
  errors: { type: Object, default: () => ({}) },
})

const timezoneOptions = getTimezones().map((zone) => ({ value: zone, label: zone }))
const dayLabels = Object.fromEntries(WEEK_DAYS.map(({ day, label }) => [day, label]))
</script>

<template>
  <Field label="Timezone" html-for="node-timezone" :error="errors.timezone">
    <Select id="node-timezone" v-model="data.timezone" :options="timezoneOptions" />
  </Field>

  <section class="detail-section">
    <header class="detail-section__header">
      <h3 class="detail-section__title">Hours</h3>
      <span class="detail-section__meta">24-hour, HH:mm</span>
    </header>

    <div class="hours">
      <template v-for="row in data.days" :key="row.day">
        <div class="hours__row" :class="{ 'hours__row--closed': !row.open }">
          <span :id="`day-${row.day}`" class="hours__day">{{ dayLabels[row.day] }}</span>

          <button
            type="button"
            role="switch"
            class="switch"
            :aria-checked="row.open"
            :aria-labelledby="`day-${row.day}`"
            @click="row.open = !row.open"
          >
            <span class="switch__thumb" />
          </button>

          <TimePicker
            v-model="row.startTime"
            :disabled="!row.open"
            :invalid="!!errors[`hours.${row.day}`]"
            :aria-label="`${dayLabels[row.day]} opens at`"
            placeholder="09:00"
          />
          <span class="hours__dash" aria-hidden="true">–</span>
          <TimePicker
            v-model="row.endTime"
            :disabled="!row.open"
            :invalid="!!errors[`hours.${row.day}`]"
            :aria-label="`${dayLabels[row.day]} closes at`"
            placeholder="17:00"
          />
        </div>
        <p v-if="errors[`hours.${row.day}`]" class="detail-error hours__error" role="alert">
          {{ errors[`hours.${row.day}`] }}
        </p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.hours {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.hours__row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr auto 1fr;
  align-items: center;
  gap: var(--space-3);
}

.hours__day {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.hours__row--closed .hours__day {
  color: var(--text-tertiary);
}

.hours__dash {
  color: var(--text-tertiary);
}

.hours__error {
  margin-top: calc(var(--space-1) * -1);
  padding-left: calc(40px + var(--space-3));
}

.switch {
  position: relative;
  width: 32px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--border-strong);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}

.switch[aria-checked='true'] {
  background: var(--accent);
}

.switch:focus-visible {
  outline: none;
  box-shadow: var(--ring-focus);
}

.switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  transition: transform var(--duration-fast) var(--ease-standard);
}

.switch[aria-checked='true'] .switch__thumb {
  transform: translateX(14px);
}

:deep(.jl-input-wrap) {
  max-width: 100px;
}
</style>
