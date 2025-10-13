class CreateProductCalculationHistoryItems < ActiveRecord::Migration[8.0]
  def change
    create_table :product_calculation_history_items do |t|
      t.references :product_calculation_history, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity
      t.decimal :price, precision: 10, scale: 2
      t.decimal :subtotal, precision: 10, scale: 2

      t.timestamps
    end
  end
end
