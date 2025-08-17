import IconCalculatorController from './icon_calculator_controller'

test('format numbers', () => {
  const c = new IconCalculatorController()
  expect(c.format(1234)).toBe('1,234')
})
