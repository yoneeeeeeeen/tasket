class AddCompanyIdToProducts < ActiveRecord::Migration[8.0]
  def change
    add_column :products, :company_id, :bigint
    add_index :products, :company_id
  end
end
