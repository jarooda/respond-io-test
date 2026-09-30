import { inject, provide } from 'vue'

const KEY = Symbol('isValidConnection')

export function provideConnectionValidator(validator) {
  provide(KEY, validator)
}

export function useConnectionValidator() {
  return inject(KEY, undefined)
}
