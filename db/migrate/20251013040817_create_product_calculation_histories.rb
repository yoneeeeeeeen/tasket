class CreateProductCalculationHistories < ActiveRecord::Migration[8.0]
  def change
    create_table :product_calculation_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title
      t.decimal :total_amount, precision: 10, scale: 2
      t.datetime :saved_at

      t.timestamps
    end
  end
end
